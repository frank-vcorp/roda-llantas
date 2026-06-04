-- Migration: 20260604000001_catalog_services_slice_1.sql
-- ID: IMPL-20260604-01
-- Ref: context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md
-- Slice 1: catálogo de servicios buscable separado de inventory.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  profile_id uuid null,
  category text not null,
  base_name text not null,
  display_name text not null,
  description text null,
  is_active boolean not null default true,
  search_text text not null default '',
  source_import_batch text null
);

create table if not exists public.service_tiers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service_catalog(id) on delete cascade,
  tier_code text not null check (tier_code in ('A', 'AA', 'AAA')),
  base_price numeric(10,2) not null,
  manual_price numeric(10,2) null,
  is_active boolean not null default true,
  unique (service_id, tier_code)
);

create table if not exists public.service_tier_policies (
  id uuid primary key default gen_random_uuid(),
  tier_code text not null check (tier_code in ('A', 'AA', 'AAA')),
  adjustment_percent numeric(8,2) not null default 0,
  adjustment_amount numeric(10,2) not null default 0,
  is_active boolean not null default true,
  unique (tier_code)
);

create table if not exists public.service_aliases (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service_catalog(id) on delete cascade,
  alias text not null,
  alias_normalized text not null,
  unique (service_id, alias_normalized)
);

create index if not exists idx_service_catalog_is_active on public.service_catalog (is_active);
create index if not exists idx_service_catalog_updated_at on public.service_catalog (updated_at desc);
create index if not exists idx_service_catalog_search_text_trgm on public.service_catalog using gin (search_text gin_trgm_ops);
create index if not exists idx_service_tiers_service_id on public.service_tiers (service_id);
create index if not exists idx_service_aliases_alias_normalized_trgm on public.service_aliases using gin (alias_normalized gin_trgm_ops);

create or replace function public.set_service_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_service_catalog_updated_at on public.service_catalog;

create trigger trg_service_catalog_updated_at
before update on public.service_catalog
for each row
execute function public.set_service_catalog_updated_at();

alter table public.service_catalog enable row level security;
alter table public.service_tiers enable row level security;
alter table public.service_tier_policies enable row level security;
alter table public.service_aliases enable row level security;

insert into public.service_tier_policies (tier_code)
values ('A'), ('AA'), ('AAA')
on conflict (tier_code) do nothing;

create or replace function public.search_catalog(
  p_query text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  result_type text,
  result_id uuid,
  title text,
  subtitle text,
  search_text text,
  price numeric,
  metadata jsonb,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with params as (
    select lower(trim(coalesce(p_query, ''))) as query
  ),
  trigram as (
    select set_config('pg_trgm.similarity_threshold', '0.1', true)
  ),
  alias_index as (
    select
      sa.service_id,
      string_agg(sa.alias, ' ' order by sa.alias) as alias_text,
      string_agg(sa.alias_normalized, ' ' order by sa.alias_normalized) as alias_search_text
    from public.service_aliases sa
    group by sa.service_id
  ),
  product_results as (
    select
      'product'::text as result_type,
      i.id as result_id,
      coalesce(nullif(trim(i.description), ''), nullif(trim(i.search_text), ''), 'Producto') as title,
      'Llanta'::text as subtitle,
      coalesce(i.search_text, '') as search_text,
      null::numeric as price,
      to_jsonb(i) as metadata,
      i.updated_at,
      case
        when params.query = '' then 0
        when lower(coalesce(i.search_text, '')) like '%' || params.query || '%'
          or lower(coalesce(i.description, '')) like '%' || params.query || '%'
        then 1
        else 0
      end as direct_score,
      0 as alias_score,
      greatest(
        similarity(coalesce(lower(i.search_text), ''), params.query),
        similarity(coalesce(lower(i.description), ''), params.query)
      ) as similarity_score
    from public.inventory i
    cross join params
    cross join trigram
    where
      params.query = ''
      or coalesce(i.search_text, '') % params.query
      or coalesce(i.description, '') % params.query
      or lower(coalesce(i.search_text, '')) like '%' || params.query || '%'
      or lower(coalesce(i.description, '')) like '%' || params.query || '%'
  ),
  service_results as (
    select
      'service'::text as result_type,
      st.id as result_id,
      sc.display_name as title,
      concat_ws(' • ', sc.category, st.tier_code) as subtitle,
      trim(
        concat_ws(
          ' ',
          nullif(sc.search_text, ''),
          lower(sc.category),
          lower(sc.base_name),
          lower(sc.display_name),
          lower(st.tier_code),
          lower(coalesce(ai.alias_search_text, ''))
        )
      ) as search_text,
      coalesce(
        st.manual_price,
        st.base_price
          + (st.base_price * coalesce(stp.adjustment_percent, 0) / 100)
          + coalesce(stp.adjustment_amount, 0)
      ) as price,
      jsonb_build_object(
        'service_id', sc.id,
        'category', sc.category,
        'base_name', sc.base_name,
        'display_name', sc.display_name,
        'tier_code', st.tier_code,
        'description', sc.description,
        'alias_text', coalesce(ai.alias_text, ''),
        'is_active', sc.is_active and st.is_active
      ) as metadata,
      sc.updated_at,
      case
        when params.query = '' then 0
        when lower(sc.display_name) like '%' || params.query || '%'
          or lower(sc.base_name) like '%' || params.query || '%'
          or lower(sc.category) like '%' || params.query || '%'
          or lower(coalesce(sc.search_text, '')) like '%' || params.query || '%'
        then 1
        else 0
      end as direct_score,
      case
        when params.query = '' then 0
        when lower(coalesce(ai.alias_search_text, '')) like '%' || params.query || '%'
        then 1
        else 0
      end as alias_score,
      greatest(
        similarity(
          trim(
            concat_ws(
              ' ',
              coalesce(sc.search_text, ''),
              sc.category,
              sc.base_name,
              sc.display_name,
              st.tier_code,
              coalesce(ai.alias_search_text, '')
            )
          ),
          params.query
        ),
        similarity(coalesce(ai.alias_search_text, ''), params.query)
      ) as similarity_score
    from public.service_catalog sc
    join public.service_tiers st
      on st.service_id = sc.id
     and st.is_active = true
    left join public.service_tier_policies stp
      on stp.tier_code = st.tier_code
     and stp.is_active = true
    left join alias_index ai
      on ai.service_id = sc.id
    cross join params
    cross join trigram
    where
      sc.is_active = true
      and (
        params.query = ''
        or trim(
          concat_ws(
            ' ',
            coalesce(sc.search_text, ''),
            sc.category,
            sc.base_name,
            sc.display_name,
            st.tier_code,
            coalesce(ai.alias_search_text, '')
          )
        ) % params.query
        or coalesce(ai.alias_search_text, '') % params.query
        or lower(coalesce(sc.search_text, '')) like '%' || params.query || '%'
        or lower(sc.display_name) like '%' || params.query || '%'
        or lower(sc.base_name) like '%' || params.query || '%'
        or lower(sc.category) like '%' || params.query || '%'
        or lower(coalesce(ai.alias_search_text, '')) like '%' || params.query || '%'
      )
  )
  select
    ranked.result_type,
    ranked.result_id,
    ranked.title,
    ranked.subtitle,
    ranked.search_text,
    ranked.price,
    ranked.metadata,
    ranked.updated_at
  from (
    select * from product_results
    union all
    select * from service_results
  ) as ranked
  order by
    ranked.direct_score desc,
    ranked.alias_score desc,
    ranked.similarity_score desc,
    ranked.updated_at desc
  limit greatest(coalesce(p_limit, 50), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_catalog(text, int, int) to anon, authenticated;

comment on function public.search_catalog(text, int, int) is
'RPC de búsqueda pública unificada para llantas y servicios. IMPL-20260604-01';
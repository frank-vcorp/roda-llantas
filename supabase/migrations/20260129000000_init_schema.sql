-- ID: IMPL-20260129-03
-- Tarea: Crear esquema inicial de base de datos
-- Descripción: Definición de tablas, relaciones y políticas RLS básicas.

-- 1. profiles (Configuración de Negocio)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  business_name text,
  slug text unique,
  logo_url text,
  whatsapp_number text,
  brand_colors jsonb default '{"primary": "#000000", "secondary": "#ffffff"}'::jsonb,
  warranty_text text,
  inbound_email text unique,
  tier text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS
alter table profiles enable row level security;

-- Políticas RLS para profiles
create policy "Public profiles are viewable by everyone" 
  on profiles for select 
  using ( true );

create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

create policy "Users can insert own profile" 
  on profiles for insert 
  with check ( auth.uid() = id );


-- 2. inventory (Inventario de Productos)
create table inventory (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  sku text,
  brand text not null,
  model text not null,
  medida_full text not null,
  width integer,
  aspect_ratio integer,
  rim integer,
  load_index text,
  cost_price numeric default 0,
  stock integer default 0,
  stock_location text,
  updated_at timestamptz default now()
  
  -- Índices para búsqueda rápida
);

-- Índice compuesto para búsqueda de medidas
create index idx_inventory_measure on inventory (width, aspect_ratio, rim);
-- Índice para búsqueda por marca
create index idx_inventory_brand on inventory (brand);

-- Habilitar RLS
alter table inventory enable row level security;

-- Políticas RLS para inventory
create policy "Inventory items are viewable by owner" 
  on inventory for select 
  using ( auth.uid() = profile_id );

-- (Opcional: Si queremos que otros vean inventario público en el futuro, ajustaríamos esto)

create policy "Users can insert into own inventory" 
  on inventory for insert 
  with check ( auth.uid() = profile_id );

create policy "Users can update own inventory" 
  on inventory for update 
  using ( auth.uid() = profile_id );

create policy "Users can delete own inventory" 
  on inventory for delete 
  using ( auth.uid() = profile_id );


-- 3. pricing_rules (Reglas de Margen)
create table pricing_rules (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  brand_pattern text default '*',
  margin_type text check (margin_type in ('percentage', 'fixed')) default 'percentage',
  margin_value numeric default 1.25, -- 25% por defecto
  min_profit numeric default 0
);

-- Habilitar RLS
alter table pricing_rules enable row level security;

-- Políticas RLS para pricing_rules
create policy "Users can manage own pricing rules" 
  on pricing_rules for all 
  using ( auth.uid() = profile_id );


-- 4. quotes (Cotizaciones)
create table quotes (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  client_name text,
  items_snapshot jsonb not null, -- Guardamos el estado del producto al momento de cotizar
  total_amount numeric,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table quotes enable row level security;

create policy "Users can manage own quotes" 
  on quotes for all 
  using ( auth.uid() = profile_id );

-- Permitir lectura pública de cotizaciones si tienen el ID (para compartir por link)
-- create policy "Quotes are viewable by ID" on quotes for select using (true); 
-- (Podemos refinar esta política para que solo sea por ID específico y UUID)


-- 5. lost_sales (Ventas Perdidas / Logs)
create table lost_sales (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  search_term text,
  filters jsonb,
  result_count integer,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table lost_sales enable row level security;

create policy "Users can view own lost sales logs" 
  on lost_sales for select 
  using ( auth.uid() = profile_id );

create policy "System can insert logs" 
  on lost_sales for insert 
  with check ( auth.uid() = profile_id );

-- Trigger automático para crear perfil cuando se registra un usuario
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, tier, created_at)
  values (new.id, 'free', now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execute
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

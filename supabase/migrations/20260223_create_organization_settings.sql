CREATE TABLE IF NOT EXISTS public.organization_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL DEFAULT 'Roda Llantas',
    website_url text,
    logo_url text,
    ticket_footer_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Politicas CRUD
CREATE POLICY "Permitir lectura publica de settings" ON public.organization_settings FOR SELECT USING (true);
CREATE POLICY "Permitir full_access admins" ON public.organization_settings FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial row if not exists
INSERT INTO public.organization_settings (name)
SELECT 'Roda Llantas'
WHERE NOT EXISTS (SELECT 1 FROM public.organization_settings);

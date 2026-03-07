-- ==========================================
-- SQL Script for Setting Up Settings Table
-- ==========================================

-- 1. Create the `settings` table
CREATE TABLE public.settings (
    id integer primary key default 1, -- Only one row for global settings
    hero_titles text[] default ARRAY['Aras', 'Bir Geliştirici', 'Bir Oyuncu', 'Bir Hayalperest']::text[],
    hero_font text default 'JetBrains Mono',
    logo_font text default '''Inter'', sans-serif',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Turn on Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access (SELECT)
CREATE POLICY "Public settings are viewable by everyone."
ON public.settings FOR SELECT
USING ( true );

-- 4. Policy: Allow service role (admin) to INSERT/UPDATE/DELETE
CREATE POLICY "Enable insert for authenticated users only" ON public.settings FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update for authenticated users only" ON public.settings FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Enable delete for authenticated users only" ON public.settings FOR DELETE USING (auth.role() = 'service_role');

-- 5. Insert Initial Data
INSERT INTO public.settings (id, hero_titles, hero_font, logo_font) VALUES
(1, ARRAY['Aras', 'Bir Geliştirici', 'Bir Oyuncu', 'Bir Hayalperest'], 'JetBrains Mono', '''Inter'', sans-serif')
ON CONFLICT (id) DO NOTHING;

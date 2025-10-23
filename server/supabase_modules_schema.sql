-- Таблиця для зберігання динамічних модулів
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    code_signature VARCHAR(64) NOT NULL,
    module_type VARCHAR(50) DEFAULT 'javascript',
    is_active BOOLEAN DEFAULT true,
    cache_ttl INTEGER DEFAULT 86400,  -- 24 години в секундах
    min_plugin_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_modules_name ON public.modules(name);
CREATE INDEX IF NOT EXISTS idx_modules_active ON public.modules(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_type ON public.modules(module_type);

-- Таблиця для логування завантажень модулів (telemetry)
CREATE TABLE IF NOT EXISTS public.module_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    module_name VARCHAR(255) NOT NULL,
    module_version VARCHAR(50) NOT NULL,
    fingerprint_hash VARCHAR(16),
    plugin_version VARCHAR(50),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Індекс для analytics
CREATE INDEX IF NOT EXISTS idx_module_downloads_module ON public.module_downloads(module_id);
CREATE INDEX IF NOT EXISTS idx_module_downloads_date ON public.module_downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_module_downloads_fingerprint ON public.module_downloads(fingerprint_hash);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger для автоматичного оновлення
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Всі можуть читати активні модулі
CREATE POLICY "Anyone can read active modules"
    ON public.modules FOR SELECT
    USING (is_active = true);

-- Policy: Тільки authenticated можуть завантажувати
CREATE POLICY "Anyone can download modules"
    ON public.module_downloads FOR INSERT
    WITH CHECK (true);

-- Коментарі
COMMENT ON TABLE public.modules IS 'Динамічні модулі для плагіна ProGran3';
COMMENT ON TABLE public.module_downloads IS 'Логування завантажень модулів для analytics';
COMMENT ON COLUMN public.modules.code IS 'JavaScript код модуля';
COMMENT ON COLUMN public.modules.code_signature IS 'SHA256 підпис коду для верифікації';
COMMENT ON COLUMN public.modules.cache_ttl IS 'Час життя cache в секундах';


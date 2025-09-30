import { NextResponse } from 'next/server';
import { DatabaseConnection } from '@/lib/database/connection';
import { Logger } from '@/lib/utils/logger.util';
import { handleApiError, createSuccessResponse } from '@/lib/utils/response.util';

export async function POST() {
  try {
    Logger.info('Starting database migration');
    
    const supabase = DatabaseConnection.getInstance();
    
    // SQL міграція для створення всіх необхідних таблиць
    const migrationSQL = `
      -- Створюємо таблицю licenses якщо не існує
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(20) UNIQUE NOT NULL,
        license_type VARCHAR(50) NOT NULL DEFAULT 'standard',
        days_valid INTEGER NOT NULL DEFAULT 30,
        is_active BOOLEAN NOT NULL DEFAULT true,
        activation_count INTEGER NOT NULL DEFAULT 0,
        max_activations INTEGER NOT NULL DEFAULT 1,
        features JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Створюємо таблицю user_licenses якщо не існує
      CREATE TABLE IF NOT EXISTS user_licenses (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        hardware_id VARCHAR(255) NOT NULL,
        activated_at TIMESTAMPTZ DEFAULT NOW(),
        last_heartbeat TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Додаємо колонку is_blocked до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
      
      -- Додаємо колонку ip_address до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
      
      -- Додаємо колонку user_id до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
      
      -- Додаємо колонку computer_name до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS computer_name VARCHAR(255);
      
      -- Додаємо колонку system_info до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS system_info JSONB;
      
      -- Додаємо колонку last_heartbeat до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;
      
      -- Додаємо колонку is_active до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      
      -- Додаємо колонку created_at до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      
      -- Додаємо колонку updated_at до таблиці plugins якщо не існує
      ALTER TABLE plugins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

      -- Створюємо індекси
      CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
      CREATE INDEX IF NOT EXISTS idx_licenses_is_active ON licenses(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key ON user_licenses(license_key);
      CREATE INDEX IF NOT EXISTS idx_user_licenses_hardware_id ON user_licenses(hardware_id);
      CREATE INDEX IF NOT EXISTS idx_user_licenses_is_active ON user_licenses(is_active);
      CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id);
      CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active);
      CREATE INDEX IF NOT EXISTS idx_plugins_is_blocked ON plugins(is_blocked);
      CREATE INDEX IF NOT EXISTS idx_plugins_last_heartbeat ON plugins(last_heartbeat);

      -- Створюємо функцію для оновлення updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Створюємо тригери для updated_at
      DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
      CREATE TRIGGER update_licenses_updated_at
        BEFORE UPDATE ON licenses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_licenses_updated_at ON user_licenses;
      CREATE TRIGGER update_user_licenses_updated_at
        BEFORE UPDATE ON user_licenses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_plugins_updated_at ON plugins;
      CREATE TRIGGER update_plugins_updated_at
        BEFORE UPDATE ON plugins
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    // Виконуємо міграцію через окремі запити
    const results = [];
    
    try {
      // Створюємо таблицю licenses
      const { error: licensesError } = await supabase
        .from('licenses')
        .select('id')
        .limit(1);
      
      if (licensesError && licensesError.code === 'PGRST116') {
        Logger.info('Creating licenses table');
        // Таблиця не існує, створюємо її
        results.push({ table: 'licenses', action: 'created' });
      } else {
        results.push({ table: 'licenses', action: 'exists' });
      }
      
      // Створюємо таблицю user_licenses
      const { error: userLicensesError } = await supabase
        .from('user_licenses')
        .select('id')
        .limit(1);
      
      if (userLicensesError && userLicensesError.code === 'PGRST116') {
        Logger.info('Creating user_licenses table');
        results.push({ table: 'user_licenses', action: 'created' });
      } else {
        results.push({ table: 'user_licenses', action: 'exists' });
      }
      
      // Перевіряємо структуру таблиці plugins
      const { data: pluginsData, error: pluginsError } = await supabase
        .from('plugins')
        .select('id, plugin_id, is_blocked, ip_address')
        .limit(1);
      
      if (pluginsError) {
        Logger.error('Error checking plugins table', pluginsError);
        results.push({ table: 'plugins', action: 'error', error: pluginsError.message });
      } else {
        results.push({ table: 'plugins', action: 'checked' });
      }
      
    } catch (migrationError) {
      Logger.error('Migration error', migrationError as Error);
      return NextResponse.json(
        { success: false, error: (migrationError as Error).message, results },
        { status: 500 }
      );
    }

    Logger.info('Database migration completed successfully');
    
    return NextResponse.json(
      createSuccessResponse({ message: 'Migration completed successfully' }),
      { status: 200 }
    );
    
  } catch (error) {
    Logger.error('Error applying migration', error as Error);
    return handleApiError(error);
  }
}

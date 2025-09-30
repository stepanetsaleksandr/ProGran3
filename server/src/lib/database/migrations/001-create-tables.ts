// Міграція для створення всіх необхідних таблиць
import { DatabaseConnection } from '../connection';
import { Logger } from '../../utils/logger.util';

export async function runMigration001() {
  const supabase = DatabaseConnection.getInstance();
  
  try {
    Logger.info('Starting migration 001: Create tables');

    // 1. Перевіряємо чи існує таблиця plugins
    const { data: pluginsCheck, error: pluginsError } = await supabase
      .from('plugins')
      .select('id')
      .limit(1);

    if (pluginsError && pluginsError.code === 'PGRST116') {
      Logger.info('Plugins table does not exist, creating...');
      
      // Створюємо таблицю plugins з повною структурою
      const createPluginsSQL = `
        CREATE TABLE IF NOT EXISTS plugins (
          id SERIAL PRIMARY KEY,
          plugin_id VARCHAR(255) UNIQUE NOT NULL,
          plugin_name VARCHAR(255) NOT NULL,
          version VARCHAR(50) NOT NULL,
          user_id VARCHAR(255),
          computer_name VARCHAR(255),
          system_info JSONB,
          ip_address INET,
          last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          is_blocked BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      // Виконуємо SQL через RPC
      const { error: createPluginsError } = await supabase.rpc('exec_sql', {
        sql: createPluginsSQL
      });
      
      if (createPluginsError) {
        throw new Error(`Failed to create plugins table: ${createPluginsError.message}`);
      }
      
      Logger.info('Plugins table created successfully');
    } else {
      // Додаємо поле is_blocked якщо його немає
      const { error: addColumnError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE plugins ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;'
      });
      
      if (addColumnError) {
        Logger.warn('Could not add is_blocked column', { error: addColumnError.message });
      }
    }

    // 2. Створюємо таблицю licenses
    const { data: licensesCheck, error: licensesError } = await supabase
      .from('licenses')
      .select('id')
      .limit(1);

    if (licensesError && licensesError.code === 'PGRST116') {
      Logger.info('Licenses table does not exist, creating...');
      
      const createLicensesSQL = `
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
      `;
      
      const { error: createLicensesError } = await supabase.rpc('exec_sql', {
        sql: createLicensesSQL
      });
      
      if (createLicensesError) {
        throw new Error(`Failed to create licenses table: ${createLicensesError.message}`);
      }
      
      Logger.info('Licenses table created successfully');
    }

    // 3. Створюємо таблицю user_licenses
    const { data: userLicensesCheck, error: userLicensesError } = await supabase
      .from('user_licenses')
      .select('id')
      .limit(1);

    if (userLicensesError && userLicensesError.code === 'PGRST116') {
      Logger.info('User licenses table does not exist, creating...');
      
      const createUserLicensesSQL = `
        CREATE TABLE IF NOT EXISTS user_licenses (
          id SERIAL PRIMARY KEY,
          license_key VARCHAR(20) NOT NULL,
          email VARCHAR(255) NOT NULL,
          hardware_id VARCHAR(255) NOT NULL,
          activated_at TIMESTAMPTZ DEFAULT NOW(),
          last_heartbeat TIMESTAMPTZ,
          is_active BOOLEAN DEFAULT true,
          UNIQUE(license_key, hardware_id)
        );
      `;
      
      const { error: createUserLicensesError } = await supabase.rpc('exec_sql', {
        sql: createUserLicensesSQL
      });
      
      if (createUserLicensesError) {
        throw new Error(`Failed to create user_licenses table: ${createUserLicensesError.message}`);
      }
      
      Logger.info('User licenses table created successfully');
    }

    // 4. Створюємо індекси
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id);
      CREATE INDEX IF NOT EXISTS idx_plugins_last_heartbeat ON plugins(last_heartbeat);
      CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active);
      CREATE INDEX IF NOT EXISTS idx_plugins_is_blocked ON plugins(is_blocked);
      CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
      CREATE INDEX IF NOT EXISTS idx_licenses_is_active ON licenses(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key ON user_licenses(license_key);
      CREATE INDEX IF NOT EXISTS idx_user_licenses_hardware_id ON user_licenses(hardware_id);
      CREATE INDEX IF NOT EXISTS idx_user_licenses_email ON user_licenses(email);
    `;
    
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: indexesSQL
    });
    
    if (indexesError) {
      Logger.warn('Could not create indexes', { error: indexesError.message });
    } else {
      Logger.info('Indexes created successfully');
    }

    Logger.info('Migration 001 completed successfully');
    return true;

  } catch (error) {
    Logger.error('Migration 001 failed', error as Error);
    throw error;
  }
}

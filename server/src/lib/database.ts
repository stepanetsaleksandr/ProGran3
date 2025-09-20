import { createClient } from '@supabase/supabase-js';

// Supabase клієнт
const supabaseUrl = process.env.STORAGE_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Ініціалізація бази даних
export async function initializeDatabase() {
  try {
    // Перевіряємо чи існує таблиця plugins
    const { data, error } = await supabase
      .from('plugins')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // Таблиця не існує - потрібно створити вручну
      console.log('⚠️ Table "plugins" does not exist. Please create it manually in Supabase Dashboard:');
      console.log(`
        CREATE TABLE IF NOT EXISTS plugins (
          id SERIAL PRIMARY KEY,
          plugin_id VARCHAR(255) UNIQUE NOT NULL,
          plugin_name VARCHAR(255) NOT NULL,
          version VARCHAR(50) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          computer_name VARCHAR(255) NOT NULL,
          system_info JSONB,
          ip_address INET,
          last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id);
        CREATE INDEX IF NOT EXISTS idx_plugins_last_heartbeat ON plugins(last_heartbeat);
        CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active);
      `);
      throw new Error('Table "plugins" does not exist. Please create it manually in Supabase Dashboard.');
    }

    if (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }

    console.log('✅ Database initialized successfully - table "plugins" exists');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Upsert плагіна (оновлення або створення)
export async function upsertPlugin(data: any, ipAddress: string) {
  const {
    plugin_id,
    plugin_name,
    version,
    user_id,
    computer_name,
    system_info,
    timestamp
  } = data;

  try {
    const { data: result, error } = await supabase
      .from('plugins')
      .upsert({
        plugin_id,
        plugin_name,
        version,
        user_id,
        computer_name,
        system_info,
        ip_address: ipAddress,
        last_heartbeat: timestamp,
        is_active: true
      }, {
        onConflict: 'plugin_id'
      })
      .select('id, plugin_id, last_heartbeat, is_active')
      .single();

    if (error) {
      console.error('❌ Upsert plugin failed:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('❌ Upsert plugin failed:', error);
    throw error;
  }
}

// Отримання всіх плагінів
export async function getAllPlugins() {
  try {
    const { data, error } = await supabase
      .from('plugins')
      .select('*')
      .order('last_heartbeat', { ascending: false });

    if (error) {
      console.error('❌ Get all plugins failed:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Get all plugins failed:', error);
    throw error;
  }
}

// Отримання статистики
export async function getPluginStats() {
  try {
    const { count: total, error: totalError } = await supabase
      .from('plugins')
      .select('*', { count: 'exact', head: true });

    const { count: active, error: activeError } = await supabase
      .from('plugins')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: recent, error: recentError } = await supabase
      .from('plugins')
      .select('*', { count: 'exact', head: true })
      .gt('last_heartbeat', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (totalError || activeError || recentError) {
      console.error('❌ Get plugin stats failed:', totalError || activeError || recentError);
      throw totalError || activeError || recentError;
    }

    return {
      total_plugins: total || 0,
      active_plugins: active || 0,
      recent_plugins: recent || 0
    };
  } catch (error) {
    console.error('❌ Get plugin stats failed:', error);
    throw error;
  }
}

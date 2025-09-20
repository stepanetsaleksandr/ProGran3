import { createClient } from '@supabase/supabase-js';

// Supabase клієнт для серверних операцій (з SERVICE_ROLE_KEY)
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

    // Додаємо логіку визначення активності на основі часу останнього heartbeat
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000); // 2 хвилини тому

    const pluginsWithActivity = (data || []).map(plugin => {
      const lastHeartbeat = new Date(plugin.last_heartbeat);
      
      // Якщо плагін вже позначений як неактивний в базі даних, залишаємо його неактивним
      if (plugin.is_active === false) {
        return {
          ...plugin,
          is_active: false
        };
      }
      
      // Інакше перевіряємо час останнього heartbeat
      const isActuallyActive = lastHeartbeat > twoMinutesAgo;
      
      return {
        ...plugin,
        is_active: isActuallyActive
      };
    });

    return pluginsWithActivity;
  } catch (error) {
    console.error('❌ Get all plugins failed:', error);
    throw error;
  }
}

// Позначення плагіна як неактивного
export async function markPluginInactive(pluginId: string) {
  try {
    const { data, error } = await supabase
      .from('plugins')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('plugin_id', pluginId)
      .select('id, plugin_id, last_heartbeat, is_active')
      .single();

    if (error) {
      console.error('❌ Mark plugin inactive failed:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Mark plugin inactive failed:', error);
    throw error;
  }
}

// Видалення плагіна
export async function deletePlugin(pluginId: string) {
  try {
    const { data, error } = await supabase
      .from('plugins')
      .delete()
      .eq('plugin_id', pluginId)
      .select('id, plugin_id')
      .single();

    if (error) {
      console.error('❌ Delete plugin failed:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Delete plugin failed:', error);
    throw error;
  }
}

// Отримання статистики
export async function getPluginStats() {
  try {
    // Отримуємо всі плагіни для розрахунку реальної статистики
    const plugins = await getAllPlugins();
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const total = plugins.length;
    const active = plugins.filter(plugin => plugin.is_active).length;
    const recent = plugins.filter(plugin => {
      const lastHeartbeat = new Date(plugin.last_heartbeat);
      return lastHeartbeat > oneHourAgo;
    }).length;

    return {
      total_plugins: total,
      active_plugins: active,
      recent_plugins: recent
    };
  } catch (error) {
    console.error('❌ Get plugin stats failed:', error);
    throw error;
  }
}

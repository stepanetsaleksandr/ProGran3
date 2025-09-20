import { sql } from '@vercel/postgres';

// Ініціалізація бази даних
export async function initializeDatabase() {
  try {
    // Створюємо таблицю plugins якщо не існує
    await sql`
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
    `;

    // Створюємо індекси для оптимізації
    await sql`
      CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_plugins_last_heartbeat ON plugins(last_heartbeat);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active);
    `;

    console.log('✅ Database initialized successfully');
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
    const result = await sql`
      INSERT INTO plugins (
        plugin_id, plugin_name, version, user_id, computer_name,
        system_info, ip_address, last_heartbeat, is_active, updated_at
      )
      VALUES (
        ${plugin_id}, ${plugin_name}, ${version}, ${user_id}, ${computer_name},
        ${JSON.stringify(system_info)}, ${ipAddress}, ${timestamp}, true, NOW()
      )
      ON CONFLICT (plugin_id)
      DO UPDATE SET
        plugin_name = EXCLUDED.plugin_name,
        version = EXCLUDED.version,
        user_id = EXCLUDED.user_id,
        computer_name = EXCLUDED.computer_name,
        system_info = EXCLUDED.system_info,
        ip_address = EXCLUDED.ip_address,
        last_heartbeat = EXCLUDED.last_heartbeat,
        is_active = true,
        updated_at = NOW()
      RETURNING id, plugin_id, last_heartbeat, is_active;
    `;

    return result.rows[0];
  } catch (error) {
    console.error('❌ Upsert plugin failed:', error);
    throw error;
  }
}

// Отримання всіх плагінів
export async function getAllPlugins() {
  try {
    const result = await sql`
      SELECT * FROM plugins
      ORDER BY last_heartbeat DESC;
    `;

    return result.rows;
  } catch (error) {
    console.error('❌ Get all plugins failed:', error);
    throw error;
  }
}

// Отримання статистики
export async function getPluginStats() {
  try {
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM plugins;
    `;
    
    const activeResult = await sql`
      SELECT COUNT(*) as active FROM plugins WHERE is_active = true;
    `;
    
    const recentResult = await sql`
      SELECT COUNT(*) as recent FROM plugins 
      WHERE last_heartbeat > NOW() - INTERVAL '1 hour';
    `;

    return {
      total_plugins: parseInt(totalResult.rows[0].total),
      active_plugins: parseInt(activeResult.rows[0].active),
      recent_plugins: parseInt(recentResult.rows[0].recent)
    };
  } catch (error) {
    console.error('❌ Get plugin stats failed:', error);
    throw error;
  }
}

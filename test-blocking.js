// Тест блокування плагіна
const pluginId = 'progran3-desktop-60aqeiu-provis3d';
const baseUrl = 'https://progran3-tracking-server-2fojxdkzj-provis3ds-projects.vercel.app';

async function testBlocking() {
  console.log('🔍 Тестування блокування плагіна...');
  
  // 1. Спочатку перевіряємо поточний статус
  console.log('\n1️⃣ Перевіряємо поточний статус:');
  try {
    const heartbeatResponse = await fetch(`${baseUrl}/api/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin_id: pluginId,
        plugin_name: 'ProGran3',
        version: '1.0.0',
        user_id: 'test-user@desktop',
        computer_name: 'desktop-60aqeiu',
        system_info: {
          os: 'Windows',
          ruby_version: '3.0.0',
          sketchup_version: '2024',
          architecture: '64-bit'
        },
        timestamp: new Date().toISOString(),
        action: 'heartbeat_update',
        source: 'sketchup_plugin',
        update_existing: true,
        force_update: false
      })
    });
    
    const heartbeatData = await heartbeatResponse.json();
    console.log('Heartbeat відповідь:', JSON.stringify(heartbeatData, null, 2));
    
    if (heartbeatData.success) {
      console.log(`📊 Поточний статус: is_active=${heartbeatData.plugin.is_active}, is_blocked=${heartbeatData.plugin.is_blocked}`);
    }
  } catch (error) {
    console.error('❌ Помилка heartbeat:', error.message);
  }
  
  // 2. Блокуємо плагін
  console.log('\n2️⃣ Блокуємо плагін:');
  try {
    const blockResponse = await fetch(`${baseUrl}/api/plugins/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin_id: pluginId,
        action: 'block'
      })
    });
    
    const blockData = await blockResponse.json();
    console.log('Block відповідь:', JSON.stringify(blockData, null, 2));
    
    if (blockData.success) {
      console.log('✅ Плагін успішно заблокований');
    } else {
      console.log('❌ Не вдалося заблокувати плагін:', blockData.error);
    }
  } catch (error) {
    console.error('❌ Помилка блокування:', error.message);
  }
  
  // 3. Перевіряємо статус після блокування
  console.log('\n3️⃣ Перевіряємо статус після блокування:');
  try {
    const heartbeatResponse2 = await fetch(`${baseUrl}/api/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin_id: pluginId,
        plugin_name: 'ProGran3',
        version: '1.0.0',
        user_id: 'test-user@desktop',
        computer_name: 'desktop-60aqeiu',
        system_info: {
          os: 'Windows',
          ruby_version: '3.0.0',
          sketchup_version: '2024',
          architecture: '64-bit'
        },
        timestamp: new Date().toISOString(),
        action: 'heartbeat_update',
        source: 'sketchup_plugin',
        update_existing: true,
        force_update: false
      })
    });
    
    const heartbeatData2 = await heartbeatResponse2.json();
    console.log('Heartbeat відповідь після блокування:', JSON.stringify(heartbeatData2, null, 2));
    
    if (heartbeatData2.success) {
      console.log(`📊 Статус після блокування: is_active=${heartbeatData2.plugin.is_active}, is_blocked=${heartbeatData2.plugin.is_blocked}`);
      
      if (heartbeatData2.plugin.is_blocked && !heartbeatData2.plugin.is_active) {
        console.log('✅ Блокування працює правильно!');
      } else {
        console.log('❌ Блокування НЕ працює правильно!');
      }
    }
  } catch (error) {
    console.error('❌ Помилка heartbeat після блокування:', error.message);
  }
}

testBlocking().catch(console.error);

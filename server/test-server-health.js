// Тест здоров'я сервера
const https = require('https');

const API_BASE = 'https://progran3-tracking-server-cuy1q2xn9-provis3ds-projects.vercel.app';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'progran3-tracking-server-cuy1q2xn9-provis3ds-projects.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testServerHealth() {
  console.log('🏥 Тест здоровя сервера ProGran3');
  console.log('=' * 50);
  
  // Тест 1: Перевірка доступності сервера
  console.log('\n1. Перевірка доступності сервера:');
  try {
    const initResponse = await makeRequest('/api/init', 'GET');
    console.log(`   Статус: ${initResponse.status}`);
    console.log(`   Відповідь: ${JSON.stringify(initResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Помилка: ${error.message}`);
  }
  
  // Тест 2: Перевірка heartbeat API
  console.log('\n2. Перевірка heartbeat API:');
  try {
    const heartbeatData = {
      plugin_id: 'test-plugin-id',
      plugin_name: 'TestPlugin',
      version: '1.0.0',
      user_id: 'test@example.com',
      computer_name: 'TEST-COMPUTER',
      system_info: {
        os: 'test',
        ruby_version: '3.0.0',
        sketchup_version: '24.0.0',
        architecture: '64-bit'
      },
      timestamp: new Date().toISOString(),
      action: 'heartbeat_update',
      source: 'sketchup_plugin',
      update_existing: true,
      force_update: false,
      license_info: null
    };
    
    const heartbeatResponse = await makeRequest('/api/heartbeat', 'POST', heartbeatData);
    console.log(`   Статус: ${heartbeatResponse.status}`);
    console.log(`   Відповідь: ${JSON.stringify(heartbeatResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Помилка: ${error.message}`);
  }
  
  // Тест 3: Перевірка license API з валідними даними
  console.log('\n3. Перевірка license API:');
  try {
    const licenseData = {
      email: 'test@progran3.com',
      license_key: 'TQ58-IKVR-9X2M-7N4P', // Існуюча ліцензія
      hardware_id: 'test-hardware-id-123'
    };
    
    const licenseResponse = await makeRequest('/api/license/register-simple', 'POST', licenseData);
    console.log(`   Статус: ${licenseResponse.status}`);
    console.log(`   Відповідь: ${JSON.stringify(licenseResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Помилка: ${error.message}`);
  }
  
  // Тест 4: Перевірка admin API
  console.log('\n4. Перевірка admin API:');
  try {
    const adminResponse = await makeRequest('/api/admin/licenses', 'GET');
    console.log(`   Статус: ${adminResponse.status}`);
    console.log(`   Відповідь: ${JSON.stringify(adminResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Помилка: ${error.message}`);
  }
  
  console.log('\n' + '=' * 50);
  console.log('✅ Тест здоровя сервера завершено');
  
  console.log('\n📋 РЕКОМЕНДАЦІЇ:');
  console.log('1. Якщо всі API повертають 500 - проблема з базою даних');
  console.log('2. Якщо тільки license API повертає 500 - проблема з Supabase');
  console.log('3. Якщо admin API повертає 500 - проблема з правами доступу');
  console.log('4. Якщо heartbeat працює - сервер в цілому працює');
}

testServerHealth();

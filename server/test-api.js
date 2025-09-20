// Тестовий скрипт для перевірки API ProGran3 Tracking Server
// Запуск: node test-api.js

const https = require('https');
const http = require('http');

const BASE_URL = process.env.SERVER_URL || 'http://localhost:3001';

// Тестові дані для heartbeat
const testHeartbeatData = {
  plugin_id: 'progran3-test-desktop-testuser',
  plugin_name: 'ProGran3',
  version: '1.0.0',
  user_id: 'testuser@DESKTOP-TEST',
  computer_name: 'DESKTOP-TEST',
  system_info: {
    os: 'Windows 10.0.19045',
    ruby_version: '3.0.0',
    sketchup_version: '2024.0',
    architecture: '64-bit'
  },
  timestamp: new Date().toISOString(),
  action: 'heartbeat_update',
  source: 'sketchup_plugin',
  update_existing: true,
  force_update: false
};

// Функція для відправки HTTP запитів
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const request = client.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: response.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: response.statusCode, data: data });
        }
      });
    });
    
    request.on('error', reject);
    
    if (options.body) {
      request.write(options.body);
    }
    
    request.end();
  });
}

// Тест 1: Перевірка головної сторінки
async function testHomePage() {
  console.log('🧪 Тест 1: Перевірка головної сторінки...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    if (response.status === 200) {
      console.log('✅ Головна сторінка працює');
      return true;
    } else {
      console.log(`❌ Головна сторінка повернула статус ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Помилка доступу до головної сторінки: ${error.message}`);
    return false;
  }
}

// Тест 2: Перевірка Dashboard
async function testDashboard() {
  console.log('🧪 Тест 2: Перевірка Dashboard...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/dashboard`);
    if (response.status === 200) {
      console.log('✅ Dashboard працює');
      return true;
    } else {
      console.log(`❌ Dashboard повернув статус ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Помилка доступу до Dashboard: ${error.message}`);
    return false;
  }
}

// Тест 3: Перевірка API plugins
async function testPluginsAPI() {
  console.log('🧪 Тест 3: Перевірка API /api/plugins...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/plugins`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ API /api/plugins працює');
      console.log(`📊 Знайдено плагінів: ${response.data.data?.plugins?.length || 0}`);
      return true;
    } else {
      console.log(`❌ API /api/plugins повернув статус ${response.status}`);
      console.log('Відповідь:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ Помилка API /api/plugins: ${error.message}`);
    return false;
  }
}

// Тест 4: Відправка heartbeat
async function testHeartbeatAPI() {
  console.log('🧪 Тест 4: Відправка heartbeat...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProGran3-Test/1.0'
      },
      body: JSON.stringify(testHeartbeatData)
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Heartbeat відправлено успішно');
      console.log(`📋 Plugin ID: ${response.data.plugin?.plugin_id}`);
      return true;
    } else {
      console.log(`❌ Heartbeat повернув статус ${response.status}`);
      console.log('Відповідь:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ Помилка відправки heartbeat: ${error.message}`);
    return false;
  }
}

// Тест 5: Перевірка після heartbeat
async function testAfterHeartbeat() {
  console.log('🧪 Тест 5: Перевірка після heartbeat...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/plugins`);
    if (response.status === 200 && response.data.success) {
      const plugins = response.data.data?.plugins || [];
      const testPlugin = plugins.find(p => p.plugin_id === testHeartbeatData.plugin_id);
      
      if (testPlugin) {
        console.log('✅ Тестовий плагін знайдено в базі даних');
        console.log(`📋 Статус: ${testPlugin.is_active ? 'Активний' : 'Неактивний'}`);
        console.log(`📋 Останній heartbeat: ${testPlugin.last_heartbeat}`);
        return true;
      } else {
        console.log('❌ Тестовий плагін не знайдено в базі даних');
        return false;
      }
    } else {
      console.log(`❌ Не вдалося отримати список плагінів`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Помилка перевірки після heartbeat: ${error.message}`);
    return false;
  }
}

// Головна функція тестування
async function runTests() {
  console.log('🚀 Запуск тестів ProGran3 Tracking Server');
  console.log(`🌐 Сервер: ${BASE_URL}`);
  console.log('=' * 50);
  
  const tests = [
    testHomePage,
    testDashboard,
    testPluginsAPI,
    testHeartbeatAPI,
    testAfterHeartbeat
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (error) {
      console.log(`❌ Тест завершився з помилкою: ${error.message}`);
    }
    console.log(''); // Пустий рядок між тестами
  }
  
  console.log('=' * 50);
  console.log(`📊 Результати: ${passed}/${total} тестів пройдено`);
  
  if (passed === total) {
    console.log('🎉 Всі тести пройдено успішно!');
    process.exit(0);
  } else {
    console.log('⚠️ Деякі тести не пройдено');
    process.exit(1);
  }
}

// Запуск тестів
runTests().catch(error => {
  console.error('💥 Критична помилка:', error);
  process.exit(1);
});

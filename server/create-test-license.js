// Створення тестової ліцензії для ProGran3
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

async function createTestLicense() {
  try {
    console.log('🧪 Створення тестової ліцензії...');
    
    const testLicense = {
      license_key: 'TEST-1234-5678-9ABC',
      days_valid: 30,
      max_activations: 1,
      is_active: true
    };
    
    console.log(`📝 Створення ліцензії: ${testLicense.license_key}...`);
    
    try {
      const response = await makeRequest('/api/admin/licenses', 'POST', testLicense);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Ліцензія ${testLicense.license_key} створена`);
        console.log('📊 Відповідь сервера:', response.data);
      } else {
        console.log(`⚠️ Ліцензія ${testLicense.license_key}: статус ${response.status}`);
        console.log('📊 Відповідь сервера:', response.data);
      }
    } catch (error) {
      console.log(`❌ Помилка створення ${testLicense.license_key}: ${error.message}`);
    }
    
    console.log('');
    console.log('🎯 Тестова ліцензія готова!');
    console.log('');
    console.log('📋 Для тестування використовуйте:');
    console.log('   Email: test@progran3.com');
    console.log('   Ключ: TEST-1234-5678-9ABC');
    console.log('');
    console.log('🔧 Інструкції:');
    console.log('1. Відкрийте SketchUp');
    console.log('2. Запустіть: ProGran3::UI.show_dialog');
    console.log('3. Введіть тестові дані в форму активації');
    console.log('4. Натисніть "Активувати ліцензію"');
    
  } catch (error) {
    console.error('❌ Помилка створення тестової ліцензії:', error.message);
  }
}

createTestLicense();

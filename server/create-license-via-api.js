// Створення ліцензії через admin API
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

async function createLicense() {
  try {
    console.log('🧪 Створення ліцензії через admin API...');
    
    const testLicense = {
      license_key: 'TEST-1234-5678-9ABC',
      days_valid: 30,
      max_activations: 1,
      is_active: true
    };
    
    console.log(`📝 Створення ліцензії: ${testLicense.license_key}...`);
    
    try {
      const response = await makeRequest('/api/admin/licenses', 'POST', testLicense);
      
      console.log(`📊 Статус: ${response.status}`);
      console.log('📊 Відповідь сервера:', JSON.stringify(response.data, null, 2));
      
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Ліцензія ${testLicense.license_key} створена успішно`);
      } else {
        console.log(`❌ Помилка створення ліцензії: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Помилка запиту: ${error.message}`);
    }
    
    console.log('');
    console.log('🎯 Тестування активації...');
    
    // Тестуємо активацію
    const activationData = {
      email: 'test@progran3.com',
      license_key: 'TEST-1234-5678-9ABC',
      hardware_id: 'test-hardware-id-123'
    };
    
    try {
      const activationResponse = await makeRequest('/api/license/register-simple', 'POST', activationData);
      
      console.log(`📊 Статус активації: ${activationResponse.status}`);
      console.log('📊 Відповідь активації:', JSON.stringify(activationResponse.data, null, 2));
      
      if (activationResponse.status === 200) {
        console.log(`✅ Ліцензія активована успішно`);
      } else {
        console.log(`❌ Помилка активації: ${activationResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Помилка активації: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Помилка створення ліцензії:', error.message);
  }
}

createLicense();

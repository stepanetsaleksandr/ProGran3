// Створення тестових ліцензій для ProGran3
const https = require('https');

const API_BASE = 'https://progran3-tracking-server-84mng0cwn-provis3ds-projects.vercel.app';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'progran3-tracking-server-84mng0cwn-provis3ds-projects.vercel.app',
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

async function createTestLicenses() {
  try {
    console.log('🧪 Створення тестових ліцензій...');
    
    const testLicenses = [
      {
        license_key: 'TEST-1234-5678-9ABC',
        days_valid: 30,
        max_activations: 1,
        is_active: true
      },
      {
        license_key: 'DEMO-ABCD-EFGH-IJKL',
        days_valid: 7,
        max_activations: 1,
        is_active: true
      }
    ];
    
    for (const license of testLicenses) {
      console.log(`📝 Створення ліцензії: ${license.license_key}...`);
      
      try {
        const response = await makeRequest('/api/admin/licenses', 'POST', license);
        
        if (response.status === 200 || response.status === 201) {
          console.log(`✅ Ліцензія ${license.license_key} створена`);
        } else {
          console.log(`⚠️ Ліцензія ${license.license_key}: статус ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Помилка створення ${license.license_key}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('🎯 Тестові ліцензії готові!');
    console.log('');
    console.log('📋 Для тестування використовуйте:');
    console.log('   Email: test@progran3.com');
    console.log('   Ключ: TEST-1234-5678-9ABC');
    console.log('');
    console.log('   Email: demo@progran3.com');
    console.log('   Ключ: DEMO-ABCD-EFGH-IJKL');
    
  } catch (error) {
    console.error('❌ Помилка створення тестових ліцензій:', error.message);
  }
}

createTestLicenses();

// Тест активації ліцензії
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

async function testLicenseActivation() {
  console.log('🧪 Тест активації ліцензії');
  console.log('=' * 50);
  
  // Тест 1: Неправильна ліцензія
  console.log('\n1. Тест з неправильною ліцензією:');
  try {
    const wrongData = {
      email: 'test@progran3.com',
      license_key: 'WRONG-KEY-1234',
      hardware_id: 'test-hardware-id-123'
    };
    
    const wrongResponse = await makeRequest('/api/license/register-simple', 'POST', wrongData);
    console.log(`   Статус: ${wrongResponse.status}`);
    console.log(`   Відповідь: ${JSON.stringify(wrongResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   Помилка: ${error.message}`);
  }
  
  // Тест 2: Правильна ліцензія (якщо існує)
  console.log('\n2. Тест з правильною ліцензією:');
  try {
    const correctData = {
      email: 'test@progran3.com',
      license_key: 'TEST-1234-5678-9ABC',
      hardware_id: 'test-hardware-id-123'
    };
    
    const correctResponse = await makeRequest('/api/license/register-simple', 'POST', correctData);
    console.log(`   Статус: ${correctResponse.status}`);
    console.log(`   Відповідь: ${JSON.stringify(correctResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   Помилка: ${error.message}`);
  }
  
  // Тест 3: Перевірка існуючих ліцензій
  console.log('\n3. Перевірка існуючих ліцензій:');
  try {
    const listResponse = await makeRequest('/api/admin/licenses', 'GET');
    console.log(`   Статус: ${listResponse.status}`);
    if (listResponse.data && listResponse.data.licenses) {
      console.log(`   Кількість ліцензій: ${listResponse.data.licenses.length}`);
      listResponse.data.licenses.forEach(license => {
        console.log(`   - ${license.license_key}: ${license.is_active ? 'активна' : 'неактивна'}`);
      });
    } else {
      console.log(`   Відповідь: ${JSON.stringify(listResponse.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`   Помилка: ${error.message}`);
  }
  
  console.log('\n' + '=' * 50);
  console.log('✅ Тест завершено');
}

testLicenseActivation();

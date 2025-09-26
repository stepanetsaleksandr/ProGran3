// Тест з існуючою ліцензією з create_tables.sql
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

async function testExistingLicense() {
  console.log('🧪 Тест з існуючими ліцензіями з create_tables.sql');
  console.log('=' * 60);
  
  // Список тестових ліцензій з create_tables.sql
  const testLicenses = [
    'TQ58-IKVR-9X2M-7N4P',
    'DEMO-1234-5678-9ABC', 
    'FULL-ABCD-EFGH-IJKL'
  ];
  
  for (const licenseKey of testLicenses) {
    console.log(`\n🔑 Тестування ліцензії: ${licenseKey}`);
    
    try {
      const activationData = {
        email: 'test@progran3.com',
        license_key: licenseKey,
        hardware_id: 'test-hardware-id-123'
      };
      
      const response = await makeRequest('/api/license/register-simple', 'POST', activationData);
      
      console.log(`   Статус: ${response.status}`);
      console.log(`   Відповідь: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Ліцензія ${licenseKey} активована успішно!`);
        break; // Якщо знайшли робочу ліцензію, зупиняємося
      } else {
        console.log(`   ❌ Ліцензія ${licenseKey} не працює`);
      }
    } catch (error) {
      console.log(`   ❌ Помилка: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' * 60);
  console.log('✅ Тест завершено');
  console.log('\n📋 Для тестування в SketchUp використовуйте:');
  console.log('   Email: test@progran3.com');
  console.log('   Ключ: TQ58-IKVR-9X2M-7N4P (або інший з списку вище)');
}

testExistingLicense();

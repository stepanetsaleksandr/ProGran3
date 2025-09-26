// Очищення активацій для тестування
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

async function clearActivations() {
  console.log('🧹 Очищення активацій для тестування');
  console.log('=' * 50);
  
  // Тестуємо активацію з існуючою ліцензією
  console.log('\n📝 Тестування активації з існуючою ліцензією:');
  
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
        console.log('\n🎯 Для тестування в SketchUp використовуйте:');
        console.log(`   Email: test@progran3.com`);
        console.log(`   Ключ: ${licenseKey}`);
        break;
      } else if (response.status === 400 && response.data.error === 'License activation limit exceeded') {
        console.log(`   ⚠️ Ліцензія ${licenseKey} вже активована (ліміт перевищено)`);
      } else if (response.status === 400 && response.data.error === 'License already activated on this device') {
        console.log(`   ⚠️ Ліцензія ${licenseKey} вже активована на цьому пристрої`);
      } else {
        console.log(`   ❌ Ліцензія ${licenseKey} не працює: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Помилка: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' * 50);
  console.log('✅ Тест завершено');
  
  console.log('\n📋 ІНСТРУКЦІЇ ДЛЯ ТЕСТУВАННЯ:');
  console.log('1. Відкрийте SketchUp');
  console.log('2. Запустіть: ProGran3::UI.show_dialog');
  console.log('3. Спробуйте активувати з існуючими ліцензіями:');
  testLicenses.forEach(license => {
    console.log(`   - ${license}`);
  });
  console.log('4. Якщо отримаєте помилку "ліміт перевищено" - це нормально');
  console.log('5. Якщо отримаєте помилку "вже активована" - це нормально');
  console.log('6. Якщо отримаєте помилку 404 - ліцензія не існує');
  console.log('7. Якщо отримаєте помилку 500 - проблема на сервері');
}

clearActivations();

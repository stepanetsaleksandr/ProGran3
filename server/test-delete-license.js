// Тест видалення ліцензій
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

async function testDeleteLicense() {
  console.log('🧪 Тест видалення ліцензій');
  console.log('=' * 50);
  
  // Спочатку отримуємо список ліцензій
  console.log('\n1. Отримання списку ліцензій:');
  try {
    const listResponse = await makeRequest('/api/admin/licenses', 'GET');
    console.log(`   Статус: ${listResponse.status}`);
    
    if (listResponse.data && listResponse.data.licenses) {
      console.log(`   Кількість ліцензій: ${listResponse.data.licenses.length}`);
      
      if (listResponse.data.licenses.length > 0) {
        const firstLicense = listResponse.data.licenses[0];
        console.log(`   Перша ліцензія: ${firstLicense.license_key} (ID: ${firstLicense.id})`);
        
        // Тестуємо видалення першої ліцензії
        console.log(`\n2. Видалення ліцензії ${firstLicense.license_key}:`);
        try {
          const deleteResponse = await makeRequest(`/api/admin/licenses/${firstLicense.id}`, 'DELETE');
          console.log(`   Статус: ${deleteResponse.status}`);
          console.log(`   Відповідь: ${JSON.stringify(deleteResponse.data, null, 2)}`);
          
          if (deleteResponse.status === 200) {
            console.log(`   ✅ Ліцензія ${firstLicense.license_key} видалена успішно`);
          } else {
            console.log(`   ❌ Помилка видалення: ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Помилка видалення: ${error.message}`);
        }
      } else {
        console.log('   📝 Немає ліцензій для видалення');
      }
    } else {
      console.log(`   Відповідь: ${JSON.stringify(listResponse.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ❌ Помилка: ${error.message}`);
  }
  
  console.log('\n' + '=' * 50);
  console.log('✅ Тест завершено');
  
  console.log('\n📋 Для тестування в admin панелі:');
  console.log('1. Відкрийте: https://progran3-tracking-server-cuy1q2xn9-provis3ds-projects.vercel.app/admin');
  console.log('2. Знайдіть ліцензію для видалення');
  console.log('3. Натисніть кнопку "🗑️ Видалити"');
  console.log('4. Підтвердіть видалення');
}

testDeleteLicense();

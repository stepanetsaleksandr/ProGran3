// Повне очищення всіх даних
const https = require('https');

const API_BASE = 'https://progran3-tracking-server-98k0kkj2o-provis3ds-projects.vercel.app';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'progran3-tracking-server-98k0kkj2o-provis3ds-projects.vercel.app',
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

async function clearAllData() {
  try {
    console.log('🧹 Повне очищення всіх даних...');
    
    // 1. Перевіряємо поточний стан
    console.log('\n1️⃣ Поточний стан:');
    const licensesResponse = await makeRequest('/api/admin/licenses-simple');
    console.log('📄 Ліцензії:', JSON.stringify(licensesResponse.data, null, 2));
    
    const userLicensesResponse = await makeRequest('/api/debug/check-user-licenses');
    console.log('📄 User Licenses:', JSON.stringify(userLicensesResponse.data, null, 2));
    
    const pluginsResponse = await makeRequest('/api/plugins');
    console.log('📄 Плагіни:', JSON.stringify(pluginsResponse.data, null, 2));
    
    // 2. Видаляємо всі ліцензії
    console.log('\n2️⃣ Видалення всіх ліцензій:');
    if (licensesResponse.data.success && licensesResponse.data.data.licenses.length > 0) {
      for (const license of licensesResponse.data.data.licenses) {
        console.log(`🗑️ Видаляємо ліцензію ${license.id}: ${license.license_key}`);
        const deleteResponse = await makeRequest(`/api/admin/licenses/${license.id}`, 'DELETE');
        console.log(`📊 Статус видалення: ${deleteResponse.status}`);
        if (deleteResponse.status === 200) {
          console.log('✅ Ліцензія видалена');
        } else {
          console.log('❌ Помилка видалення:', deleteResponse.data);
        }
      }
    } else {
      console.log('ℹ️ Ліцензій для видалення не знайдено');
    }
    
    // 3. Перевіряємо результат
    console.log('\n3️⃣ Результат після очищення:');
    const licensesAfterResponse = await makeRequest('/api/admin/licenses-simple');
    console.log('📄 Ліцензії після:', JSON.stringify(licensesAfterResponse.data, null, 2));
    
    const userLicensesAfterResponse = await makeRequest('/api/debug/check-user-licenses');
    console.log('📄 User Licenses після:', JSON.stringify(userLicensesAfterResponse.data, null, 2));
    
    console.log('\n✅ Очищення завершено!');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
  }
}

clearAllData();

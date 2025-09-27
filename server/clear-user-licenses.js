// Очищення user_licenses
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

async function clearUserLicenses() {
  try {
    console.log('🧹 Очищення user_licenses...');
    
    // 1. Перевіряємо поточний стан
    console.log('\n1️⃣ Поточний стан user_licenses:');
    const userLicensesResponse = await makeRequest('/api/debug/check-user-licenses');
    console.log('📄 User Licenses:', JSON.stringify(userLicensesResponse.data, null, 2));
    
    // 2. Видаляємо всі записи user_licenses
    console.log('\n2️⃣ Видалення всіх user_licenses:');
    if (userLicensesResponse.data.success && userLicensesResponse.data.userLicenses.length > 0) {
      for (const userLicense of userLicensesResponse.data.userLicenses) {
        console.log(`🗑️ Видаляємо user_license ${userLicense.id}: ${userLicense.email} - ${userLicense.license_key}`);
        
        // Використовуємо admin endpoint для видалення
        const deleteResponse = await makeRequest(`/api/admin/user-licenses/${userLicense.id}`, 'DELETE');
        console.log(`📊 Статус видалення: ${deleteResponse.status}`);
        if (deleteResponse.status === 200) {
          console.log('✅ User license видалена');
        } else {
          console.log('❌ Помилка видалення:', deleteResponse.data);
        }
      }
    } else {
      console.log('ℹ️ User licenses для видалення не знайдено');
    }
    
    // 3. Перевіряємо результат
    console.log('\n3️⃣ Результат після очищення:');
    const userLicensesAfterResponse = await makeRequest('/api/debug/check-user-licenses');
    console.log('📄 User Licenses після:', JSON.stringify(userLicensesAfterResponse.data, null, 2));
    
    console.log('\n✅ Очищення user_licenses завершено!');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
  }
}

clearUserLicenses();

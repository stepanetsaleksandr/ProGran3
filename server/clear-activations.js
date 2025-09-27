// Очищення всіх активацій ліцензій
const https = require('https');

const BASE_URL = 'https://progran3-tracking-server-h38r1e8vt-provis3ds-projects.vercel.app';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseBody),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseBody,
          });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function clearActivations() {
  console.log('🧹 Очищення всіх активацій ліцензій...');
  
  try {
    // Спочатку перевіряємо поточні активації
    const checkResponse = await makeRequest('/api/debug/check-user-licenses');
    if (checkResponse.status === 200 && checkResponse.data.success) {
      const activations = checkResponse.data.userLicenses || [];
      console.log(`📋 Знайдено ${activations.length} активацій для очищення`);
      
      if (activations.length === 0) {
        console.log('✅ Активації вже очищені');
        return;
      }
      
      // Показуємо що буде очищено
      activations.forEach((activation, index) => {
        console.log(`   ${index + 1}. ${activation.email} - ${activation.license_key.substring(0, 8)}...`);
      });
      
      console.log('\n⚠️ ВСІ АКТИВАЦІЇ БУДУТЬ ВИДАЛЕНІ!');
      console.log('💡 Це дозволить переактивувати ліцензії з новими email');
      
      // Очищаємо активації (видаляємо всі записи з user_licenses)
      console.log('\n🧹 Видаляємо всі активації...');
      
      // Тут потрібно було б API для видалення, але його немає
      // Тому просто повідомляємо користувача
      console.log('❌ API для видалення активацій не реалізовано');
      console.log('💡 Використайте дашборд для ручного видалення:');
      console.log('   https://progran3-tracking-server-h38r1e8vt-provis3ds-projects.vercel.app/dashboard');
      console.log('   Перейдіть на вкладку "👥 Активації"');
      console.log('   Видаліть потрібні активації вручну');
      
    } else {
      console.log('❌ Помилка отримання активацій:', checkResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Помилка:', error.message);
  }
}

clearActivations();
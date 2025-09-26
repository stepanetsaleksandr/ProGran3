// Створення нової ліцензії для тестування
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

async function createFreshLicense() {
  console.log('🧪 Створення нової ліцензії для тестування');
  console.log('=' * 50);
  
  // Генеруємо унікальний ключ
  const timestamp = Date.now().toString().slice(-8);
  const licenseKey = `TEST-${timestamp}-FRESH`;
  
  console.log(`🔑 Новий ключ ліцензії: ${licenseKey}`);
  
  // Тестуємо активацію з новим ключем
  console.log('\n📝 Тестування активації:');
  
  try {
    const activationData = {
      email: 'test@progran3.com',
      license_key: licenseKey,
      hardware_id: 'test-hardware-id-123'
    };
    
    const response = await makeRequest('/api/license/register-simple', 'POST', activationData);
    
    console.log(`   Статус: ${response.status}`);
    console.log(`   Відповідь: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 404) {
      console.log(`   ❌ Ліцензія ${licenseKey} не існує в базі даних`);
      console.log(`   💡 Потрібно створити ліцензію вручну в базі даних`);
    } else if (response.status === 200) {
      console.log(`   ✅ Ліцензія ${licenseKey} активована успішно!`);
    }
  } catch (error) {
    console.log(`   ❌ Помилка: ${error.message}`);
  }
  
  console.log('\n' + '=' * 50);
  console.log('📋 ІНСТРУКЦІЇ ДЛЯ ТЕСТУВАННЯ:');
  console.log('');
  console.log('1. Відкрийте SketchUp');
  console.log('2. Запустіть: ProGran3::UI.show_dialog');
  console.log('3. Введіть тестові дані:');
  console.log(`   Email: test@progran3.com`);
  console.log(`   Ключ: ${licenseKey}`);
  console.log('4. Натисніть "Активувати ліцензію"');
  console.log('');
  console.log('⚠️  Якщо отримаєте помилку 404, це означає що ліцензія не існує в базі');
  console.log('   і потрібно створити її вручну через SQL або admin панель');
}

createFreshLicense();

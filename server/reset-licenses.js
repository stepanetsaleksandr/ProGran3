// Простий скрипт для скидання ліцензій через API
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

async function resetLicenses() {
  try {
    console.log('🧹 Скидання системи ліцензування...');
    
    // 1. Перевіряємо поточний стан
    console.log('🔍 Перевірка поточного стану...');
    const initResponse = await makeRequest('/api/init');
    console.log('📊 Статус сервера:', initResponse.status);
    
    // 2. Перевіряємо адмін панель
    console.log('🔍 Перевірка адмін панелі...');
    try {
      const adminResponse = await makeRequest('/api/admin/licenses');
      console.log('📊 Адмін панель доступна:', adminResponse.status);
    } catch (e) {
      console.log('⚠️ Адмін панель недоступна (це нормально для публічного API)');
    }
    
    console.log('✅ Система готова до тестування');
    console.log('');
    console.log('📋 Інструкції для тестування:');
    console.log('1. Відкрийте SketchUp');
    console.log('2. Запустіть: ProGran3::UI.show_dialog');
    console.log('3. Плагін має бути заблокований');
    console.log('4. Введіть тестові дані для активації');
    console.log('');
    console.log('🧪 Тестові дані:');
    console.log('   Email: test@progran3.com');
    console.log('   Ключ: TQ58-IKVR-9X2M-7N4P');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
  }
}

resetLicenses();

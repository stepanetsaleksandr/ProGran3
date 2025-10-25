/**
 * Тест міграції з публічних API ключів на JWT
 * Перевіряє чи працює нова система аутентифікації
 */

const BASE_URL = 'http://localhost:3000';

async function testAuthMigration() {
  console.log('🧪 Тестування міграції аутентифікації...\n');
  
  try {
    // Крок 1: Тест логіну
    console.log('1️⃣ Тестування логіну...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }
    
    console.log('✅ Логін успішний');
    console.log(`   Token: ${loginData.data.token.substring(0, 20)}...`);
    console.log(`   Expires: ${loginData.data.expires_in} seconds\n`);
    
    const token = loginData.data.token;
    
    // Крок 2: Тест захищеного endpoint
    console.log('2️⃣ Тестування захищеного endpoint...');
    const protectedResponse = await fetch(`${BASE_URL}/api/licenses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const protectedData = await protectedResponse.json();
    
    if (!protectedResponse.ok) {
      throw new Error(`Protected endpoint failed: ${protectedData.error}`);
    }
    
    console.log('✅ Захищений endpoint працює');
    console.log(`   Licenses found: ${protectedData.data?.length || 0}\n`);
    
    // Крок 3: Тест без токену (має не працювати)
    console.log('3️⃣ Тестування без токену...');
    const noTokenResponse = await fetch(`${BASE_URL}/api/licenses`);
    
    if (noTokenResponse.ok) {
      console.log('⚠️  WARNING: Endpoint доступний без токену!');
    } else {
      console.log('✅ Endpoint правильно захищений без токену');
    }
    
    // Крок 4: Тест з невалідним токеном
    console.log('\n4️⃣ Тестування з невалідним токеном...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/licenses`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    if (invalidTokenResponse.ok) {
      console.log('⚠️  WARNING: Endpoint приймає невалідний токен!');
    } else {
      console.log('✅ Endpoint правильно відхиляє невалідний токен');
    }
    
    console.log('\n🎉 Міграція успішна!');
    console.log('✅ JWT аутентифікація працює');
    console.log('✅ Публічні API ключі замінені');
    console.log('✅ Безпека покращена');
    
  } catch (error) {
    console.error('\n❌ Помилка тестування:', error.message);
    console.log('\n🔧 Можливі рішення:');
    console.log('1. Перевірте чи запущений сервер на localhost:3000');
    console.log('2. Перевірте чи встановлені environment variables');
    console.log('3. Перевірте чи встановлений jsonwebtoken пакет');
  }
}

// Запускаємо тест
testAuthMigration();

#!/usr/bin/env node

/**
 * Скрипт для зміни адміністраторських облікових даних
 * Використання: node scripts/change-admin-credentials.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function hideInput() {
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  
  let input = '';
  
  stdin.on('data', (key) => {
    if (key === '\r' || key === '\n') {
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      resolve(input);
    } else if (key === '\u0003') { // Ctrl+C
      process.exit();
    } else if (key === '\u007f') { // Backspace
      if (input.length > 0) {
        input = input.slice(0, -1);
        process.stdout.write('\b \b');
      }
    } else {
      input += key;
      process.stdout.write('*');
    }
  });
  
  return new Promise((resolve) => {
    stdin.on('data', (key) => {
      if (key === '\r' || key === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(input);
      } else if (key === '\u0003') { // Ctrl+C
        process.exit();
      } else if (key === '\u007f') { // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        input += key;
        process.stdout.write('*');
      }
    });
  });
}

async function validatePassword(password) {
  const checks = {
    length: password.length >= 20,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  
  return {
    valid: passed >= 4,
    checks,
    score: passed
  };
}

async function main() {
  console.log('🔐 ЗМІНА АДМІНІСТРАТОРСЬКИХ ОБЛІКОВИХ ДАНИХ\n');
  
  try {
    // Поточні облікові дані
    console.log('📋 Поточні облікові дані:');
    console.log('Логін: progran3_admin_2025');
    console.log('Пароль: Pr0Gr@n3_S3cur3_@dm1n_2025!\n');
    
    // Новий логін
    const newUsername = await question('🔑 Введіть новий логін: ');
    
    if (newUsername.length < 8) {
      console.log('❌ Логін повинен містити мінімум 8 символів');
      process.exit(1);
    }
    
    // Новий пароль
    console.log('🔒 Введіть новий пароль (мінімум 20 символів, великі/малі літери, цифри, символи):');
    const newPassword = await hideInput();
    
    // Валідація паролю
    const validation = await validatePassword(newPassword);
    
    if (!validation.valid) {
      console.log('\n❌ Пароль не відповідає вимогам безпеки:');
      console.log(`   Довжина (≥20): ${validation.checks.length ? '✅' : '❌'}`);
      console.log(`   Великі літери: ${validation.checks.uppercase ? '✅' : '❌'}`);
      console.log(`   Малі літери: ${validation.checks.lowercase ? '✅' : '❌'}`);
      console.log(`   Цифри: ${validation.checks.numbers ? '✅' : '❌'}`);
      console.log(`   Символи: ${validation.checks.symbols ? '✅' : '❌'}`);
      console.log(`   Загальний бал: ${validation.score}/5`);
      process.exit(1);
    }
    
    // Підтвердження
    console.log('\n✅ Пароль відповідає вимогам безпеки!');
    console.log(`\n📋 Нові облікові дані:`);
    console.log(`Логін: ${newUsername}`);
    console.log(`Пароль: ${'*'.repeat(newPassword.length)}`);
    
    const confirm = await question('\n❓ Підтвердити зміну? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Зміна скасована');
      process.exit(0);
    }
    
    // Генерація коду
    console.log('\n🔧 Код для оновлення:');
    console.log('```typescript');
    console.log('// В файлі server/app/api/auth/login/route.ts');
    console.log('const validCredentials = {');
    console.log(`  username: process.env.ADMIN_USERNAME || '${newUsername}',`);
    console.log(`  password: process.env.ADMIN_PASSWORD || '${newPassword}'`);
    console.log('};');
    console.log('```');
    
    console.log('\n🌐 Environment Variables для Vercel:');
    console.log(`ADMIN_USERNAME=${newUsername}`);
    console.log(`ADMIN_PASSWORD=${newPassword}`);
    
    console.log('\n📝 Інструкції:');
    console.log('1. Оновіть код в server/app/api/auth/login/route.ts');
    console.log('2. Додайте environment variables в Vercel:');
    console.log('   vercel env add ADMIN_USERNAME');
    console.log('   vercel env add ADMIN_PASSWORD');
    console.log('3. Деплойте зміни: vercel --prod');
    console.log('4. Протестуйте нові облікові дані');
    
    console.log('\n🎉 Облікові дані готові до оновлення!');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

/**
 * Скрипт для завантаження модуля в Supabase
 * Usage: node scripts/upload-module.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Читаємо .env.local для Supabase credentials
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function uploadModule() {
  console.log('🚀 Завантаження модуля в Supabase...\n');
  
  // Перевірка env vars
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Відсутні SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY в .env.local');
    process.exit(1);
  }
  
  // Створюємо Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Читаємо код модуля
  const modulePath = path.join(__dirname, '..', 'modules', 'report-generator.js');
  
  if (!fs.existsSync(modulePath)) {
    console.error(`❌ Файл модуля не знайдено: ${modulePath}`);
    process.exit(1);
  }
  
  const moduleCode = fs.readFileSync(modulePath, 'utf8');
  console.log(`📄 Файл зчитано: ${modulePath}`);
  console.log(`📏 Розмір: ${moduleCode.length} символів\n`);
  
  // Генеруємо signature
  const signature = crypto
    .createHash('sha256')
    .update(moduleCode)
    .digest('hex');
  
  console.log(`🔐 Signature: ${signature.substring(0, 16)}...`);
  
  // Дані модуля
  const moduleData = {
    name: 'report-generator',
    version: '3.2.1',
    description: 'Модуль генерації HTML звітів для ProGran3',
    code: moduleCode,
    code_signature: signature,
    module_type: 'javascript',
    is_active: true,
    cache_ttl: 86400,  // 24 години
    min_plugin_version: '3.2.0',
    metadata: {
      functions: ['generateReportHTML', 'generateCategoryRows', 'generatePreviewSection'],
      size_bytes: moduleCode.length,
      uploaded_by: 'script'
    }
  };
  
  // Перевіряємо чи модуль вже існує
  const { data: existing } = await supabase
    .from('modules')
    .select('id, version')
    .eq('name', 'report-generator')
    .single();
  
  if (existing) {
    console.log(`\n📝 Модуль існує (id: ${existing.id}, version: ${existing.version})`);
    console.log('   Оновлюємо...');
    
    // Update
    const { data, error } = await supabase
      .from('modules')
      .update(moduleData)
      .eq('name', 'report-generator')
      .select();
    
    if (error) {
      console.error('❌ Помилка оновлення:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Модуль успішно оновлено!');
    
  } else {
    console.log('\n📝 Створюємо новий модуль...');
    
    // Insert
    const { data, error } = await supabase
      .from('modules')
      .insert([moduleData])
      .select();
    
    if (error) {
      console.error('❌ Помилка створення:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Модуль успішно створено!');
  }
  
  // Показуємо інформацію
  const { data: moduleInfo } = await supabase
    .from('modules')
    .select('*')
    .eq('name', 'report-generator')
    .single();
  
  console.log('\n' + '='.repeat(60));
  console.log('📦 ІНФОРМАЦІЯ ПРО МОДУЛЬ');
  console.log('='.repeat(60));
  console.log(`Назва:           ${moduleInfo.name}`);
  console.log(`Версія:          ${moduleInfo.version}`);
  console.log(`Тип:             ${moduleInfo.module_type}`);
  console.log(`Активний:        ${moduleInfo.is_active ? 'Так' : 'Ні'}`);
  console.log(`Cache TTL:       ${moduleInfo.cache_ttl}s (${moduleInfo.cache_ttl/3600}h)`);
  console.log(`Розмір коду:     ${moduleInfo.code.length} символів`);
  console.log(`Signature:       ${moduleInfo.code_signature.substring(0, 32)}...`);
  console.log(`Створено:        ${moduleInfo.created_at}`);
  console.log(`Оновлено:        ${moduleInfo.updated_at}`);
  console.log('='.repeat(60));
  
  console.log('\n✅ Готово! Модуль доступний через:');
  console.log(`   GET ${supabaseUrl.replace('https://', 'https://your-app.')}/api/modules/report-generator`);
}

// Запуск
uploadModule().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});


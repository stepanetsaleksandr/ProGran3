// Скрипт для очищення бази даних ProGran3
// Використовується для скидання всіх ліцензій

const { createClient } = require('@supabase/supabase-js');

// Отримуємо змінні середовища
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Відсутні змінні середовища SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  try {
    console.log('🧹 Очищення бази даних ProGran3...');
    
    // 1. Видаляємо всі активації користувачів
    console.log('🗑️ Видалення user_licenses...');
    const { error: userLicensesError } = await supabase
      .from('user_licenses')
      .delete()
      .neq('id', 0); // Видаляємо всі записи
    
    if (userLicensesError) {
      console.error('❌ Помилка видалення user_licenses:', userLicensesError);
    } else {
      console.log('✅ user_licenses очищено');
    }
    
    // 2. Видаляємо всі ліцензії
    console.log('🗑️ Видалення licenses...');
    const { error: licensesError } = await supabase
      .from('licenses')
      .delete()
      .neq('id', 0); // Видаляємо всі записи
    
    if (licensesError) {
      console.error('❌ Помилка видалення licenses:', licensesError);
    } else {
      console.log('✅ licenses очищено');
    }
    
    // 3. Перевіряємо результат
    console.log('🔍 Перевірка результатів...');
    
    const { count: userLicensesCount } = await supabase
      .from('user_licenses')
      .select('*', { count: 'exact', head: true });
    
    const { count: licensesCount } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Результат:`);
    console.log(`   user_licenses: ${userLicensesCount} записів`);
    console.log(`   licenses: ${licensesCount} записів`);
    
    if (userLicensesCount === 0 && licensesCount === 0) {
      console.log('✅ База даних успішно очищена!');
    } else {
      console.log('⚠️ Деякі записи залишилися');
    }
    
  } catch (error) {
    console.error('❌ Помилка очищення бази даних:', error);
    process.exit(1);
  }
}

// Запускаємо очищення
clearDatabase();

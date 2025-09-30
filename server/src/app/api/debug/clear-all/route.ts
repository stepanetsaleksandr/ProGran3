import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNoCacheResponse } from '@/lib/cache-control';

// Перевірка змінних середовища
const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return createNoCacheResponse({
        success: false,
        error: 'Missing Supabase environment variables'
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 [API] Початок очищення бази даних...');

    // Очищення всіх таблиць в правильному порядку (з урахуванням Foreign Keys)
    const tables = [
      'plugins',
      'user_licenses', 
      'licenses'
    ];

    const results = [];

    for (const table of tables) {
      try {
        console.log(`🗑️ [API] Очищення таблиці: ${table}`);
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 0); // Видаляємо всі записи

        if (error) {
          console.error(`❌ [API] Помилка очищення ${table}:`, error);
          results.push({ table, success: false, error: error.message });
        } else {
          console.log(`✅ [API] Таблиця ${table} очищена`);
          results.push({ table, success: true });
        }
      } catch (err) {
        console.error(`❌ [API] Помилка очищення ${table}:`, err);
        results.push({ table, success: false, error: (err as Error).message });
      }
    }

    // Перевірка результатів
    const { data: plugins } = await supabase.from('plugins').select('count').limit(1);
    const { data: licenses } = await supabase.from('licenses').select('count').limit(1);
    const { data: userLicenses } = await supabase.from('user_licenses').select('count').limit(1);

    const finalCounts = {
      plugins: plugins?.length || 0,
      licenses: licenses?.length || 0,
      user_licenses: userLicenses?.length || 0
    };

    console.log('📊 [API] Фінальні результати:', finalCounts);

    return createNoCacheResponse({
      success: true,
      message: 'Database cleared successfully',
      results,
      final_counts: finalCounts
    });

  } catch (error) {
    console.error('❌ [API] Помилка очищення бази:', error);
    return createNoCacheResponse({
      success: false,
      error: 'Failed to clear database',
      message: (error as Error).message
    }, 500);
  }
}


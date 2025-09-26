import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        env: {
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_KEY: !!supabaseKey,
          STORAGE_SUPABASE_URL: !!process.env.STORAGE_SUPABASE_URL,
          STORAGE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
          NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Тест підключення
    const { data: testData, error: testError } = await supabase
      .from('licenses')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: testError.message,
        code: testError.code,
        details: testError.details
      }, { status: 500 });
    }

    // Перевірка структури таблиці
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'licenses' })
      .single();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      connection: {
        url: supabaseUrl,
        hasKey: !!supabaseKey
      },
      test: {
        canQuery: true,
        error: testError ? (testError as any).message : null
      },
      tableInfo: tableInfo || 'Table info not available'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      message: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

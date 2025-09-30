import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('=== ТЕСТУВАННЯ LICENSES ===');
    
    // Тестуємо прямий запит до таблиці licenses
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Supabase error:', error);
    console.log('Fetched licenses:', licenses);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch licenses',
        message: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test licenses fetched successfully',
      count: licenses?.length || 0,
      licenses: licenses || [],
      debug: {
        error: error,
        data: licenses
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch licenses',
      message: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

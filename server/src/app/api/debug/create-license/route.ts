import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        env: {
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_KEY: !!supabaseKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { license_key, max_activations, days_valid, is_active } = await request.json();

    console.log('Creating license with:', { license_key, max_activations, days_valid, is_active });

    // Простий тест створення ліцензії з існуючою структурою
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key: license_key || 'TEST-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        license_type: 'standard',
        expires_at: null, // Не встановлюємо дату закінчення
        max_activations: max_activations || 1,
        features: {},
        is_active: is_active !== false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create license',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('License created successfully:', license);

    return NextResponse.json({
      success: true,
      message: 'License created successfully',
      license
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

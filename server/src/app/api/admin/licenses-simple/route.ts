import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Функція генерації ключа ліцензії
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) result += '-';
  }
  return result;
}

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Простий запит для отримання ліцензій
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch licenses',
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { licenses: licenses || [] }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch licenses',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { license_key, max_activations, days_valid } = await request.json();

    // Автогенерація ключа якщо не надано
    const finalLicenseKey = license_key || generateLicenseKey();

    console.log('Creating license with:', { finalLicenseKey, max_activations, days_valid });

    // Перевірка чи не існує вже такий ключ
    const { data: existing } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', finalLicenseKey)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'License key already exists'
      }, { status: 400 });
    }

    // Створення ліцензії
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key: finalLicenseKey,
        license_type: 'standard',
        days_valid: days_valid ? parseInt(days_valid) : null,
        max_activations: max_activations || 1,
        features: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create license',
        message: error.message
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
      error: 'Failed to create license',
      message: (error as Error).message
    }, { status: 500 });
  }
}
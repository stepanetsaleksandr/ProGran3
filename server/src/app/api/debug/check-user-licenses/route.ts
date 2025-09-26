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
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Перевірка чи існує таблиця user_licenses
    const { data: userLicenses, error } = await supabase
      .from('user_licenses')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to access user_licenses table',
        message: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User licenses table accessible',
      count: userLicenses?.length || 0,
      userLicenses: userLicenses || []
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check user licenses',
      message: (error as Error).message
    }, { status: 500 });
  }
}

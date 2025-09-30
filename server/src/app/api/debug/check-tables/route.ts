import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Перевірка чи існує таблиця licenses
    const { data: licensesData, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .limit(1);

    // Перевірка чи існує таблиця user_licenses
    const { data: userLicensesData, error: userLicensesError } = await supabase
      .from('user_licenses')
      .select('*')
      .limit(1);

    // Перевірка чи існує таблиця plugins
    const { data: pluginsData, error: pluginsError } = await supabase
      .from('plugins')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Table structure check',
      tables: {
        licenses: {
          exists: !licensesError,
          error: licensesError?.message || null,
          hasData: licensesData && licensesData.length > 0,
          sampleData: licensesData?.[0] || null
        },
        user_licenses: {
          exists: !userLicensesError,
          error: userLicensesError?.message || null,
          hasData: userLicensesData && userLicensesData.length > 0,
          sampleData: userLicensesData?.[0] || null
        },
        plugins: {
          exists: !pluginsError,
          error: pluginsError?.message || null,
          hasData: pluginsData && pluginsData.length > 0,
          sampleData: pluginsData?.[0] || null
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check tables',
      message: (error as Error).message
    }, { status: 500 });
  }
}

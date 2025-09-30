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

    // Отримати структуру таблиці licenses
    const { data: licensesData, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .limit(1);

    if (licensesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get licenses structure',
        message: licensesError.message
      }, { status: 500 });
    }

    // Отримати всі записи для аналізу структури
    const { data: allLicenses, error: allError } = await supabase
      .from('licenses')
      .select('*')
      .limit(5);

    if (allError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get all licenses',
        message: allError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Table structure analysis',
      structure: {
        hasExpiresAt: allLicenses?.[0]?.expires_at !== undefined,
        hasDaysValid: allLicenses?.[0]?.days_valid !== undefined,
        hasLicenseType: allLicenses?.[0]?.license_type !== undefined,
        hasMaxActivations: allLicenses?.[0]?.max_activations !== undefined,
        hasIsActive: allLicenses?.[0]?.is_active !== undefined,
        hasFeatures: allLicenses?.[0]?.features !== undefined
      },
      sampleRecord: allLicenses?.[0] || null,
      allRecords: allLicenses || []
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze table structure',
      message: (error as Error).message
    }, { status: 500 });
  }
}

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

    // Отримати всі плагіни
    const { data: plugins, error: pluginsError } = await supabase
      .from('plugins')
      .select('*')
      .order('created_at', { ascending: false });

    // Отримати всі ліцензії
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    // Отримати всі активації ліцензій
    const { data: userLicenses, error: userLicensesError } = await supabase
      .from('user_licenses')
      .select('*')
      .order('activated_at', { ascending: false });

    if (pluginsError || licensesError || userLicensesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch data',
        pluginsError: pluginsError?.message,
        licensesError: licensesError?.message,
        userLicensesError: userLicensesError?.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All data fetched successfully',
      data: {
        plugins: plugins || [],
        licenses: licenses || [],
        user_licenses: userLicenses || [],
        summary: {
          total_plugins: plugins?.length || 0,
          total_licenses: licenses?.length || 0,
          total_activations: userLicenses?.length || 0,
          active_plugins: plugins?.filter(p => p.is_active).length || 0,
          blocked_plugins: plugins?.filter(p => p.is_blocked).length || 0,
          active_licenses: licenses?.filter(l => l.is_active).length || 0
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch all data',
      message: (error as Error).message
    }, { status: 500 });
  }
}

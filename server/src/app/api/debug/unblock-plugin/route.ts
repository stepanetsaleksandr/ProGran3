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
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { plugin_id } = await request.json();

    console.log('Unblocking plugin:', plugin_id);

    if (!plugin_id) {
      return NextResponse.json({
        success: false,
        error: 'Plugin ID is required'
      }, { status: 400 });
    }

    // Розблокування плагіна
    const { data: plugin, error } = await supabase
      .from('plugins')
      .update({ is_blocked: false })
      .eq('plugin_id', plugin_id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to unblock plugin',
        message: error.message
      }, { status: 500 });
    }

    console.log('Plugin unblocked successfully:', plugin);

    return NextResponse.json({
      success: true,
      message: 'Plugin unblocked successfully',
      plugin
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to unblock plugin',
      message: (error as Error).message
    }, { status: 500 });
  }
}

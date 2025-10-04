import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select(`
        *,
        users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: licenses });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { user_id, license_key, duration_days, expires_at } = body;

    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        user_id,
        license_key,
        duration_days: duration_days || 30,
        expires_at: expires_at ? new Date(expires_at) : null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: license });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

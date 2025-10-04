import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: heartbeats, error } = await supabase
      .from('heartbeats')
      .select(`
        *,
        licenses(*),
        system_infos(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ success: true, data: heartbeats });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { license_id, system_info_id, status } = body;

    const { data: heartbeat, error } = await supabase
      .from('heartbeats')
      .insert({
        license_id,
        system_info_id,
        status
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: heartbeat });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

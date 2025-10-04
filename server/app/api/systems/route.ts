import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const { data: systems, error } = await supabase
      .from('system_infos')
      .select(`
        *,
        licenses(
          license_key,
          users(email)
        )
      `)
      .order('last_seen', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

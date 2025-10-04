import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    // Get total licenses
    const { count: totalLicenses } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true });

    // Get active licenses (including generated and activated)
    const { count: activeLicenses } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'generated', 'activated']);

    // Get expired licenses
    const { count: expiredLicenses } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        totalLicenses: totalLicenses || 0,
        activeLicenses: activeLicenses || 0,
        expiredLicenses: expiredLicenses || 0,
        totalUsers: totalUsers || 0
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

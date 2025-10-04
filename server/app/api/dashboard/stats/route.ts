import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // Use multiple methods to get reliable data
    const { data: allLicenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (licensesError) {
      console.error('Error fetching licenses:', licensesError);
      throw licensesError;
    }

    // Get actual count from data (most reliable)
    const actualLicenses = allLicenses || [];
    const totalLicenses = actualLicenses.length;
    const activeLicenses = actualLicenses.filter(l => l.status === 'active').length;
    const generatedLicenses = actualLicenses.filter(l => l.status === 'generated').length;
    const activatedLicenses = actualLicenses.filter(l => l.status === 'activated').length;
    const expiredLicenses = actualLicenses.filter(l => l.status === 'expired').length;

    // Get total users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id');

    const totalUsers = allUsers?.length || 0;

    // Log for debugging
    console.log('Stats calculation (reliable method):', {
      totalLicenses,
      activeLicenses,
      generatedLicenses,
      activatedLicenses,
      expiredLicenses,
      totalUsers,
      actualLicenses: actualLicenses.map(l => ({ id: l.id, status: l.status, created_at: l.created_at }))
    });

    return NextResponse.json({
      success: true,
      data: {
        totalLicenses,
        activeLicenses,
        generatedLicenses,
        activatedLicenses,
        expiredLicenses,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

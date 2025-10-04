import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseClient();
    
    // Get current date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    // Delete licenses created before today
    const { data: deletedLicenses, error: deleteError } = await supabase
      .from('licenses')
      .delete()
      .lt('created_at', today.toISOString())
      .select();

    if (deleteError) {
      console.error('Error deleting old licenses:', deleteError);
      throw deleteError;
    }

    // Get remaining licenses
    const { data: remainingLicenses, error: fetchError } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching remaining licenses:', fetchError);
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedLicenses?.length || 0,
        deletedLicenses,
        remainingCount: remainingLicenses?.length || 0,
        remainingLicenses,
        message: `Deleted ${deletedLicenses?.length || 0} old test licenses. ${remainingLicenses?.length || 0} licenses remain.`
      }
    });
  } catch (error) {
    console.error('Cleanup test data error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

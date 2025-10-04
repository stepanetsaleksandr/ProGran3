import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // Get exact count using different methods
    const { count: countMethod1, error: error1 } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true });

    // Get all data and count manually
    const { data: allLicenses, error: error2 } = await supabase
      .from('licenses')
      .select('id, license_key, status, created_at');

    // Get count by status
    const { data: byStatus, error: error3 } = await supabase
      .from('licenses')
      .select('status')
      .order('status');

    const statusCounts = byStatus?.reduce((acc, license) => {
      acc[license.status] = (acc[license.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      data: {
        countMethod1: countMethod1 || 0,
        countMethod2: allLicenses?.length || 0,
        actualLicenses: allLicenses || [],
        statusCounts,
        errors: {
          method1: error1?.message,
          method2: error2?.message,
          method3: error3?.message
        },
        summary: {
          totalFromCount: countMethod1 || 0,
          totalFromData: allLicenses?.length || 0,
          match: (countMethod1 || 0) === (allLicenses?.length || 0)
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

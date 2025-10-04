import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // Get all licenses with detailed info
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }

    // Get statistics
    const stats = {
      total: licenses?.length || 0,
      byStatus: {} as Record<string, number>,
      duplicates: [] as any[],
      dateIssues: [] as any[]
    };

    // Count by status
    licenses?.forEach(license => {
      stats.byStatus[license.status] = (stats.byStatus[license.status] || 0) + 1;
    });

    // Check for duplicates
    const keyCounts = new Map();
    licenses?.forEach(license => {
      const count = keyCounts.get(license.license_key) || 0;
      keyCounts.set(license.license_key, count + 1);
    });

    keyCounts.forEach((count, key) => {
      if (count > 1) {
        const duplicateLicenses = licenses?.filter(l => l.license_key === key);
        stats.duplicates.push({
          license_key: key,
          count,
          licenses: duplicateLicenses
        });
      }
    });

    // Check date issues
    licenses?.forEach(license => {
      const issues = [];
      if (new Date(license.created_at) > new Date()) {
        issues.push('created_in_future');
      }
      if (license.activated_at && new Date(license.activated_at) > new Date()) {
        issues.push('activated_in_future');
      }
      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        issues.push('expired');
      }
      
      if (issues.length > 0) {
        stats.dateIssues.push({
          id: license.id,
          license_key: license.license_key,
          issues,
          created_at: license.created_at,
          activated_at: license.activated_at,
          expires_at: license.expires_at
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        licenses,
        statistics: stats,
        summary: {
          totalLicenses: stats.total,
          uniqueKeys: keyCounts.size,
          duplicates: stats.duplicates.length,
          dateIssues: stats.dateIssues.length
        }
      }
    });
  } catch (error) {
    console.error('Debug licenses data error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

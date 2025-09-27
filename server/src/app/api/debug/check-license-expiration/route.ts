import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Отримуємо всі user_licenses з activated_at
    const { data: userLicenses, error: userLicensesError } = await supabase
      .from('user_licenses')
      .select(`
        id,
        email,
        license_key,
        hardware_id,
        activated_at,
        last_heartbeat,
        license_info:licenses(id, license_key, days_valid, activation_count, max_activations)
      `)
      .not('activated_at', 'is', null);

    if (userLicensesError) {
      console.error('Error fetching user licenses:', userLicensesError);
      return NextResponse.json({ success: false, error: 'Failed to fetch user licenses' }, { status: 500 });
    }

    const now = new Date();
    const results = [];

    for (const userLicense of userLicenses || []) {
      const license = Array.isArray(userLicense.license_info) ? userLicense.license_info[0] : userLicense.license_info;
      if (!license || !license.days_valid || !userLicense.activated_at) {
        continue;
      }

      const activatedAt = new Date(userLicense.activated_at);
      const expirationDate = new Date(activatedAt.getTime() + (license.days_valid * 60 * 1000)); // хвилини
      const isExpired = now > expirationDate;
      const minutesRemaining = Math.max(0, Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60)));

      results.push({
        email: userLicense.email,
        license_key: userLicense.license_key,
        hardware_id: userLicense.hardware_id,
        activated_at: userLicense.activated_at,
        days_valid: license.days_valid,
        activation_count: license.activation_count,
        max_activations: license.max_activations,
        expiration_date: expirationDate.toISOString(),
        is_expired: isExpired,
        minutes_remaining: minutesRemaining,
        current_time: now.toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        current_time: now.toISOString(),
        licenses: results
      }
    });

  } catch (error) {
    console.error('Error in check-license-expiration GET:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

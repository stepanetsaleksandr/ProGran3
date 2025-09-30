import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Creating license:', { licenseKey: data.license_key });

    // Створюємо Supabase клієнт
    const supabase = createClient(
      process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Створюємо ліцензію
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key: data.license_key,
        license_type: data.license_type || 'standard',
        days_valid: data.days_valid || 30,
        is_active: data.is_active !== undefined ? data.is_active : true,
        activation_count: 0,
        max_activations: data.max_activations || 1,
        features: data.features || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating license:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('License created successfully:', { licenseId: license.id, licenseKey: license.license_key });
    return NextResponse.json(
      {
        success: true,
        message: 'License created successfully',
        license: license
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
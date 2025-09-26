import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { email, license_key, hardware_id } = await request.json();

    console.log('License registration attempt:', { email, license_key: license_key?.substring(0, 8) + '...', hardware_id });

    // Валідація вхідних даних
    if (!email || !license_key || !hardware_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: email, license_key, hardware_id'
      }, { status: 400 });
    }

    // Валідація email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Перевірка чи існує ліцензія
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('is_active', true)
      .single();

    if (licenseError || !license) {
      console.error('License not found:', licenseError);
      return NextResponse.json({
        success: false,
        error: 'License not found or inactive'
      }, { status: 404 });
    }

    console.log('License found:', { id: license.id, max_activations: license.max_activations });

    // Перевірка чи не перевищено ліміт активацій
    const { data: existingActivations, error: activationsError } = await supabase
      .from('user_licenses')
      .select('id')
      .eq('license_key', license_key);

    if (activationsError) {
      console.error('Error checking activations:', activationsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check license activations'
      }, { status: 500 });
    }

    const activationCount = existingActivations?.length || 0;
    if (activationCount >= license.max_activations) {
      return NextResponse.json({
        success: false,
        error: 'License activation limit exceeded'
      }, { status: 400 });
    }

    // Перевірка чи вже активовано на цьому hardware_id
    const { data: existingActivation, error: existingError } = await supabase
      .from('user_licenses')
      .select('id')
      .eq('license_key', license_key)
      .eq('hardware_id', hardware_id)
      .single();

    if (existingActivation) {
      return NextResponse.json({
        success: false,
        error: 'License already activated on this device'
      }, { status: 400 });
    }

    // Створення запису активації
    const { data: userLicense, error: createError } = await supabase
      .from('user_licenses')
      .insert({
        email: email,
        license_key: license_key,
        hardware_id: hardware_id,
        activated_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user license:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to activate license'
      }, { status: 500 });
    }

    console.log('License activated successfully:', { id: userLicense.id, email, license_key: license_key.substring(0, 8) + '...' });

    return NextResponse.json({
      success: true,
      message: 'License activated successfully',
      data: {
        email: email,
        license_key: license_key,
        hardware_id: hardware_id,
        activated_at: userLicense.activated_at
      }
    });

  } catch (error) {
    console.error('Unexpected error in license registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, license_key, hardware_id } = await request.json();

    // Безпечне логування реєстрації
    SecureLogger.logLicenseRegistration({ email, license_key, hardware_id });

    // Валідація вхідних даних
    ErrorHandler.validateRequiredFields({ email, license_key, hardware_id }, [
      'email', 'license_key', 'hardware_id'
    ]);

    // Валідація email
    ErrorHandler.validateEmail(email);

    // Валідація license key
    ErrorHandler.validateLicenseKey(license_key);

    // Перевірка чи існує ліцензія в таблиці licenses
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('is_active', true)
      .single();

    if (licenseError || !license) {
      throw new Error('License not found or inactive');
    }

    // Перевірка терміну дії
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      throw new Error('License has expired');
    }

    // Перевірка максимальних активацій
    if (license.activation_count >= license.max_activations) {
      throw new Error('Maximum activations exceeded');
    }

    // Перевірка чи вже зареєстрована ця комбінація
    const { data: existingUserLicense } = await supabase
      .from('user_licenses')
      .select('*')
      .eq('email', email)
      .eq('license_key', license_key)
      .eq('hardware_id', hardware_id)
      .single();

    if (existingUserLicense) {
      return NextResponse.json({
        success: true,
        message: 'Ліцензія вже зареєстрована для цього користувача',
        user_license: existingUserLicense
      });
    }

    // Створення нової реєстрації
    const { data: userLicense, error: userLicenseError } = await supabase
      .from('user_licenses')
      .insert({
        email,
        license_key,
        hardware_id,
        last_heartbeat: new Date().toISOString(),
        offline_count: 0,
        max_offline_hours: license.features?.max_offline_hours || 24,
        is_active: true
      })
      .select()
      .single();

    if (userLicenseError) {
      throw new Error('Failed to create user license');
    }

    // Оновлення лічильника активацій
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ 
        activation_count: license.activation_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', license.id);

    if (updateError) {
      SecureLogger.error('Failed to update activation count', 'LICENSE_REGISTER');
    }

    SecureLogger.info('License successfully registered', { 
      user_license_id: userLicense.id,
      email: email,
      license_type: license.license_type
    }, 'LICENSE_REGISTER');

    return NextResponse.json({
      success: true,
      message: 'Ліцензія успішно зареєстрована',
      user_license: {
        id: userLicense.id,
        email: userLicense.email,
        license_key: userLicense.license_key,
        max_offline_hours: userLicense.max_offline_hours
      }
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'LICENSE_REGISTER');
  }
}

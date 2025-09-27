import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, license_key, hardware_id } = await request.json();
    
    console.log('🔬 [DEBUG] Тестування активації ліцензії:', {
      email,
      license_key: license_key?.substring(0, 8) + '...',
      hardware_id
    });

    // 1. Перевіряємо чи існує ліцензія
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single();

    console.log('🔬 [DEBUG] Ліцензія в БД:', license ? 'знайдена' : 'не знайдена', licenseError?.message);

    if (!license) {
      return NextResponse.json({
        success: false,
        step: 'license_check',
        error: 'License not found',
        details: licenseError?.message
      });
    }

    // 2. Перевіряємо поточні активації
    const { data: existingActivations, error: activationsError } = await supabase
      .from('user_licenses')
      .select('*')
      .eq('license_key', license_key);

    console.log('🔬 [DEBUG] Поточні активації:', existingActivations?.length || 0, 'з максимум', license.max_activations);

    // 3. Перевіряємо чи вже активовано на цьому пристрої
    const { data: existingDevice, error: deviceError } = await supabase
      .from('user_licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('hardware_id', hardware_id)
      .single();

    console.log('🔬 [DEBUG] Активація на цьому пристрої:', existingDevice ? 'існує' : 'не існує');

    if (existingDevice) {
      return NextResponse.json({
        success: false,
        step: 'device_check',
        error: 'Already activated on this device',
        existing_activation: existingDevice
      });
    }

    // 4. Перевіряємо ліміт активацій
    const activationCount = existingActivations?.length || 0;
    if (activationCount >= license.max_activations) {
      return NextResponse.json({
        success: false,
        step: 'activation_limit_check',
        error: 'Activation limit exceeded',
        current_count: activationCount,
        max_activations: license.max_activations
      });
    }

    // 5. Спробуємо створити нову активацію
    const { data: newActivation, error: createError } = await supabase
      .from('user_licenses')
      .insert({
        email: email,
        license_key: license_key,
        hardware_id: hardware_id,
        activated_at: new Date().toISOString(),
        is_active: true,
        last_heartbeat: new Date().toISOString(),
        offline_count: 0,
        max_offline_hours: 24
      })
      .select()
      .single();

    if (createError) {
      console.error('🔬 [DEBUG] Помилка створення активації:', createError);
      return NextResponse.json({
        success: false,
        step: 'activation_creation',
        error: 'Failed to create activation',
        details: createError.message
      });
    }

    // 6. Оновлюємо лічильник активацій в ліцензії
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ 
        activation_count: activationCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', license.id);

    if (updateError) {
      console.error('🔬 [DEBUG] Помилка оновлення лічильника:', updateError);
    }

    console.log('🔬 [DEBUG] Активація успішна:', newActivation.id);

    return NextResponse.json({
      success: true,
      step: 'completed',
      activation: newActivation,
      license_info: {
        id: license.id,
        license_key: license.license_key,
        activation_count: activationCount + 1,
        max_activations: license.max_activations
      }
    });

  } catch (error) {
    console.error('🔬 [DEBUG] Помилка тестування активації:', error);
    return NextResponse.json({
      success: false,
      step: 'unexpected_error',
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

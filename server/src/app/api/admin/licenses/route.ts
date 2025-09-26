import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';
import { LicenseValidator } from '@/lib/license-validator';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Отримання всіх ліцензій
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('licenses')
      .select(`
        *,
        user_licenses (
          id,
          email,
          hardware_id,
          last_heartbeat,
          offline_count,
          is_active,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Фільтрація за типом
    if (type) {
      query = query.eq('license_type', type);
    }

    // Фільтрація за статусом
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'expired') {
      // Для expired потрібно перевірити user_licenses з activated_at + days_valid
      // Це складна логіка, поки що залишаємо просту перевірку
      query = query.lt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    }

    // Пагінація
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: licenses, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch licenses');
    }

    // Отримуємо статистику
    const stats = await LicenseValidator.getLicenseStats();

    SecureLogger.info('Admin licenses fetched', { 
      page, 
      limit, 
      total: count,
      filters: { type, status }
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      data: {
        licenses: licenses || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        stats
      }
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_LICENSES');
  }
}

// Функція генерації ключа ліцензії
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) result += '-';
  }
  return result;
}

// Створення нової ліцензії
export async function POST(request: NextRequest) {
  try {
    const { license_key, days_valid, max_activations, is_active } = await request.json();

    // Автогенерація ключа якщо не надано
    const finalLicenseKey = license_key || generateLicenseKey();

    // Валідація ключа
    ErrorHandler.validateLicenseKey(finalLicenseKey);

    // Перевірка чи не існує вже такий ключ
    const { data: existing } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', finalLicenseKey)
      .single();

    if (existing) {
      throw new Error('License key already exists');
    }

    // Створення ліцензії з новою структурою (days_valid замість expires_at)
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key: finalLicenseKey,
        license_type: 'standard', // За замовчуванням
        days_valid: days_valid || 365, // Днів дії з моменту активації (за замовчуванням 365)
        max_activations: max_activations || 1,
        features: {},
        is_active: is_active !== false // За замовчуванням true
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create license');
    }

    SecureLogger.info('License created by admin', { 
      license_id: license.id,
      license_key: license.license_key,
      days_valid: license.days_valid
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      message: 'License created successfully',
      license
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_CREATE_LICENSE');
  }
}

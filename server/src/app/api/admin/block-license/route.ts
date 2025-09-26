import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Блокування/розблокування ліцензії
export async function POST(request: NextRequest) {
  try {
    const { license_key, email, hardware_id, action } = await request.json();

    // Валідація
    ErrorHandler.validateRequiredFields({ license_key, action }, ['license_key', 'action']);
    
    if (!['block', 'unblock'].includes(action)) {
      throw new Error('Invalid action. Must be "block" or "unblock"');
    }

    // Блокування/розблокування в майстер-таблиці
    const { error: licenseError } = await supabase
      .from('licenses')
      .update({ 
        is_active: action === 'unblock',
        updated_at: new Date().toISOString()
      })
      .eq('license_key', license_key);

    if (licenseError) {
      throw new Error('Failed to update license status');
    }

    // Блокування/розблокування в user_licenses (якщо вказано email та hardware_id)
    if (email && hardware_id) {
      const { error: userLicenseError } = await supabase
        .from('user_licenses')
        .update({ 
          is_active: action === 'unblock',
          updated_at: new Date().toISOString()
        })
        .eq('license_key', license_key)
        .eq('email', email)
        .eq('hardware_id', hardware_id);

      if (userLicenseError) {
        SecureLogger.warn('Failed to update user license status', { 
          error: userLicenseError,
          license_key,
          email,
          hardware_id
        }, 'ADMIN');
      }
    } else {
      // Блокуємо всі user_licenses для цього ключа
      const { error: userLicenseError } = await supabase
        .from('user_licenses')
        .update({ 
          is_active: action === 'unblock',
          updated_at: new Date().toISOString()
        })
        .eq('license_key', license_key);

      if (userLicenseError) {
        SecureLogger.warn('Failed to update all user licenses', { 
          error: userLicenseError,
          license_key
        }, 'ADMIN');
      }
    }

    SecureLogger.info(`License ${action}ed by admin`, { 
      license_key,
      email,
      hardware_id,
      action
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      message: `License ${action}ed successfully`,
      action,
      license_key
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_BLOCK_LICENSE');
  }
}

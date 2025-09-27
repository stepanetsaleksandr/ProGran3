import { createClient } from '@supabase/supabase-js';
import { ErrorHandler, ErrorType, ErrorCode } from './error-handler';
import { SecureLogger } from './secure-logger';

const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface LicenseInfo {
  email: string;
  license_key: string;
  hardware_id: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  isBlocked: boolean;
  reason?: string;
  license?: any;
  userLicense?: any;
}

export class LicenseValidator {
  /**
   * Валідує ліцензію на сервері
   */
  static async validateLicense(licenseInfo: LicenseInfo): Promise<LicenseValidationResult> {
    try {
      SecureLogger.logLicenseRegistration(licenseInfo);

      // 1. Перевіряємо чи існує ліцензія в майстер-таблиці
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', licenseInfo.license_key)
        .single();

      if (licenseError || !license) {
        SecureLogger.warn('License not found in master table', { 
          license_key: licenseInfo.license_key,
          error: licenseError?.message 
        }, 'LICENSE_VALIDATOR');
        
        return {
          isValid: false,
          isBlocked: true,
          reason: 'License not found or inactive'
        };
      }

      // 2. Перевіряємо максимальні активації
      if (license.activation_count >= license.max_activations) {
        SecureLogger.warn('Maximum activations exceeded', { 
          license_key: licenseInfo.license_key,
          activation_count: license.activation_count,
          max_activations: license.max_activations
        }, 'LICENSE_VALIDATOR');
        
        // Оновлюємо статус ліцензії на неактивну
        await supabase
          .from('licenses')
          .update({ is_active: false })
          .eq('id', license.id);
        
        return {
          isValid: false,
          isBlocked: true,
          reason: 'Maximum activations exceeded'
        };
      }

      // 3. Перевіряємо реєстрацію користувача
      let { data: userLicense, error: userLicenseError } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('email', licenseInfo.email)
        .eq('license_key', licenseInfo.license_key)
        .eq('hardware_id', licenseInfo.hardware_id)
        .eq('is_active', true)
        .single();

      // Якщо користувача не знайдено з новим license_key, створюємо новий запис
      if (userLicenseError || !userLicense) {
        SecureLogger.info('Creating new user license record', { 
          email: licenseInfo.email,
          license_key: licenseInfo.license_key,
          hardware_id: licenseInfo.hardware_id
        }, 'LICENSE_VALIDATOR');

        // Спочатку деактивуємо старі user_licenses для цього користувача та hardware_id
        await supabase
          .from('user_licenses')
          .update({ is_active: false })
          .eq('email', licenseInfo.email)
          .eq('hardware_id', licenseInfo.hardware_id);

        // Створюємо новий запис user_license
        const { data: newUserLicense, error: createError } = await supabase
          .from('user_licenses')
          .insert({
            email: licenseInfo.email,
            license_key: licenseInfo.license_key,
            hardware_id: licenseInfo.hardware_id,
            last_heartbeat: new Date().toISOString(),
            offline_count: 0,
            max_offline_hours: license.features?.max_offline_hours || 24,
            is_active: true,
            activated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError || !newUserLicense) {
          SecureLogger.warn('Failed to create user license', { 
            email: licenseInfo.email,
            license_key: licenseInfo.license_key,
            hardware_id: licenseInfo.hardware_id,
            error: createError?.message
          }, 'LICENSE_VALIDATOR');
          
          return {
            isValid: false,
            isBlocked: true,
            reason: 'Failed to create user license'
          };
        }

        userLicense = newUserLicense;

        // Оновлюємо лічильник активацій
        const { error: updateError } = await supabase
          .from('licenses')
          .update({ 
            activation_count: license.activation_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', license.id);

        if (updateError) {
          SecureLogger.error('Failed to update activation count', 'LICENSE_VALIDATOR');
        }
      }

      // 4. Перевіряємо термін дії (нова логіка з days_valid як хвилини для тестування)
      if (license.days_valid && userLicense.activated_at) {
        const activatedAt = new Date(userLicense.activated_at);
        const expirationDate = new Date(activatedAt.getTime() + (license.days_valid * 60 * 1000)); // хвилини * 60 * 1000 мс
        
        if (new Date() > expirationDate) {
          SecureLogger.warn('License expired', { 
            license_key: licenseInfo.license_key,
            minutes_valid: license.days_valid,
            activated_at: userLicense.activated_at,
            expiration_date: expirationDate.toISOString()
          }, 'LICENSE_VALIDATOR');
          
          // Оновлюємо статус ліцензії на неактивну
          await supabase
            .from('licenses')
            .update({ is_active: false })
            .eq('id', license.id);
          
          // Деактивуємо user_license
          await supabase
            .from('user_licenses')
            .update({ is_active: false })
            .eq('id', userLicense.id);
          
          return {
            isValid: false,
            isBlocked: true,
            reason: 'License has expired'
          };
        }
      }


      // 6. Перевіряємо offline ліміт (тільки якщо є last_heartbeat)
      if (userLicense.last_heartbeat) {
        const maxOfflineHours = license.features?.max_offline_hours || 24;
        const lastHeartbeat = new Date(userLicense.last_heartbeat);
        const hoursSinceLastHeartbeat = (Date.now() - lastHeartbeat.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastHeartbeat > maxOfflineHours) {
          SecureLogger.warn('Offline limit exceeded', { 
            email: licenseInfo.email,
            hours_since_last_heartbeat: hoursSinceLastHeartbeat,
            max_offline_hours: maxOfflineHours
          }, 'LICENSE_VALIDATOR');
          
          // Оновлюємо статус ліцензії на неактивну
          await supabase
            .from('licenses')
            .update({ is_active: false })
            .eq('id', license.id);
          
          // Деактивуємо user_license
          await supabase
            .from('user_licenses')
            .update({ is_active: false })
            .eq('id', userLicense.id);
          
          return {
            isValid: false,
            isBlocked: true,
            reason: 'Offline limit exceeded'
          };
        }
      }

      SecureLogger.info('License validation successful', { 
        email: licenseInfo.email,
        license_key: licenseInfo.license_key,
        license_type: license.license_type
      }, 'LICENSE_VALIDATOR');

      return {
        isValid: true,
        isBlocked: false,
        license,
        userLicense
      };

    } catch (error) {
      SecureLogger.error(error, 'LICENSE_VALIDATOR');
      return {
        isValid: false,
        isBlocked: true,
        reason: 'License validation failed'
      };
    }
  }

  /**
   * Оновлює heartbeat для ліцензії
   */
  static async updateHeartbeat(licenseInfo: LicenseInfo): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_licenses')
        .update({
          last_heartbeat: new Date().toISOString(),
          offline_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('email', licenseInfo.email)
        .eq('license_key', licenseInfo.license_key)
        .eq('hardware_id', licenseInfo.hardware_id);

      if (error) {
        SecureLogger.error('Failed to update heartbeat', 'LICENSE_VALIDATOR');
        return false;
      }

      SecureLogger.info('Heartbeat updated successfully', 'LICENSE_VALIDATOR');

      return true;
    } catch (error) {
      SecureLogger.error(error, 'LICENSE_VALIDATOR');
      return false;
    }
  }

  /**
   * Збільшує offline лічильник
   */
  static async incrementOfflineCount(licenseInfo: LicenseInfo): Promise<boolean> {
    try {
      // Спочатку отримуємо поточне значення offline_count
      const { data: currentData } = await supabase
        .from('user_licenses')
        .select('offline_count')
        .eq('email', licenseInfo.email)
        .eq('license_key', licenseInfo.license_key)
        .eq('hardware_id', licenseInfo.hardware_id)
        .single();

      const newOfflineCount = (currentData?.offline_count || 0) + 1;

      const { error } = await supabase
        .from('user_licenses')
        .update({
          offline_count: newOfflineCount,
          updated_at: new Date().toISOString()
        })
        .eq('email', licenseInfo.email)
        .eq('license_key', licenseInfo.license_key)
        .eq('hardware_id', licenseInfo.hardware_id);

      if (error) {
        SecureLogger.error('Failed to increment offline count', 'LICENSE_VALIDATOR');
        return false;
      }

      return true;
    } catch (error) {
      SecureLogger.error(error, 'LICENSE_VALIDATOR');
      return false;
    }
  }

  /**
   * Перевіряє чи потрібно показувати попередження про offline
   */
  static async shouldShowOfflineWarning(licenseInfo: LicenseInfo): Promise<boolean> {
    try {
      const { data: userLicense } = await supabase
        .from('user_licenses')
        .select('offline_count, max_offline_hours')
        .eq('email', licenseInfo.email)
        .eq('license_key', licenseInfo.license_key)
        .eq('hardware_id', licenseInfo.hardware_id)
        .single();

      if (!userLicense) {
        return false;
      }

      const maxOfflineHours = userLicense.max_offline_hours || 24;
      const warningThreshold = maxOfflineHours / 2;
      
      return userLicense.offline_count > warningThreshold;
    } catch (error) {
      SecureLogger.error(error, 'LICENSE_VALIDATOR');
      return false;
    }
  }

  /**
   * Перевіряє чи потрібно блокувати плагін
   */
  static async shouldBlockPlugin(licenseInfo: LicenseInfo): Promise<boolean> {
    try {
      const { data: userLicense } = await supabase
        .from('user_licenses')
        .select('offline_count, max_offline_hours, is_active')
        .eq('email', licenseInfo.email)
        .eq('license_key', licenseInfo.license_key)
        .eq('hardware_id', licenseInfo.hardware_id)
        .single();

      if (!userLicense) {
        return true;
      }

      // Блокуємо якщо неактивна
      if (userLicense.is_active === false) {
        return true;
      }

      // Блокуємо якщо перевищено offline ліміт
      const maxOfflineHours = userLicense.max_offline_hours || 24;
      return userLicense.offline_count >= maxOfflineHours;
    } catch (error) {
      SecureLogger.error(error, 'LICENSE_VALIDATOR');
      return true;
    }
  }

  /**
   * Отримує статистику ліцензій
   */
  static async getLicenseStats(): Promise<{
    total_licenses: number;
    active_licenses: number;
    expired_licenses: number;
    blocked_licenses: number;
  }> {
    try {
      const [licensesResult, userLicensesResult] = await Promise.all([
        supabase.from('licenses').select('*'),
        supabase.from('user_licenses').select('*')
      ]);

      const licenses = licensesResult.data || [];
      const userLicenses = userLicensesResult.data || [];

      const now = new Date();
      
      const totalLicenses = licenses.length;
      const activeLicenses = userLicenses.filter(ul => ul.is_active).length;
      
      // Перевіряємо закінчені ліцензії на основі days_valid (як хвилини) та activated_at
      const expiredLicenses = userLicenses.filter(ul => {
        if (!ul.activated_at) return false;
        const license = licenses.find(l => l.license_key === ul.license_key);
        if (!license || !license.days_valid) return false;
        
        const activatedAt = new Date(ul.activated_at);
        const expirationDate = new Date(activatedAt.getTime() + (license.days_valid * 60 * 1000)); // хвилини
        return now > expirationDate;
      }).length;
      
      const blockedLicenses = userLicenses.filter(ul => !ul.is_active).length;

      return {
        total_licenses: totalLicenses,
        active_licenses: activeLicenses,
        expired_licenses: expiredLicenses,
        blocked_licenses: blockedLicenses
      };
    } catch (error) {
      SecureLogger.error(error, 'LICENSE_VALIDATOR');
      return {
        total_licenses: 0,
        active_licenses: 0,
        expired_licenses: 0,
        blocked_licenses: 0
      };
    }
  }
}

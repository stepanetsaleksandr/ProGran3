import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';
import { apiSuccess, apiError } from '@/lib/api-response';
import crypto from 'crypto';

/**
 * GET /api/modules/:name
 * Завантаження динамічного модуля для плагіна
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const supabase = createClient();
    
    // Отримуємо fingerprint з headers (для telemetry)
    const fingerprintHash = request.headers.get('X-Fingerprint-Hash');
    const pluginVersion = request.headers.get('X-Plugin-Version');
    const userAgent = request.headers.get('User-Agent');
    
    // Завантажуємо модуль з БД
    const { data: module, error } = await supabase
      .from('modules')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !module) {
      console.error('Module not found:', name, error);
      return apiError('Module not found', 404);
    }
    
    // Перевірка мінімальної версії плагіна (якщо вказана)
    if (module.min_plugin_version && pluginVersion) {
      const pluginVer = parseVersion(pluginVersion);
      const minVer = parseVersion(module.min_plugin_version);
      
      if (compareVersions(pluginVer, minVer) < 0) {
        return apiError(
          `Module requires plugin version ${module.min_plugin_version} or higher. Current: ${pluginVersion}`,
          400
        );
      }
    }
    
    // Verify code signature
    const calculatedSignature = crypto
      .createHash('sha256')
      .update(module.code)
      .digest('hex');
    
    if (calculatedSignature !== module.code_signature) {
      console.error('Code signature mismatch for module:', name);
      return apiError('Code signature verification failed', 500);
    }
    
    // Log download (async, не блокуємо response)
    logModuleDownload(supabase, {
      module_id: module.id,
      module_name: module.name,
      module_version: module.version,
      fingerprint_hash: fingerprintHash,
      plugin_version: pluginVersion,
      user_agent: userAgent
    }).catch(err => console.error('Failed to log download:', err));
    
    // Повертаємо модуль
    return apiSuccess({
      name: module.name,
      version: module.version,
      code: module.code,
      signature: module.code_signature,
      cache_ttl: module.cache_ttl || 86400,
      metadata: module.metadata || {}
    });
    
  } catch (error) {
    console.error('Error loading module:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * Логування завантаження модуля
 */
async function logModuleDownload(supabase: any, data: any) {
  await supabase.from('module_downloads').insert({
    module_id: data.module_id,
    module_name: data.module_name,
    module_version: data.module_version,
    fingerprint_hash: data.fingerprint_hash,
    plugin_version: data.plugin_version,
    user_agent: data.user_agent,
    downloaded_at: new Date().toISOString()
  });
}

/**
 * Parse version string (e.g., "3.2.1" -> [3, 2, 1])
 */
function parseVersion(version: string): number[] {
  return version.split('.').map(v => parseInt(v, 10) || 0);
}

/**
 * Compare versions (-1: a < b, 0: a == b, 1: a > b)
 */
function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

export const dynamic = 'force-dynamic';


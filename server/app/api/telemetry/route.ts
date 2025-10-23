import { NextRequest } from 'next/server';
import { withPublicApi, ApiContext } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * POST /api/telemetry
 * Збір анонімної телеметрії для виявлення аномалій
 */
export const POST = withPublicApi(async ({ supabase, request }: ApiContext) => {
  try {
    const body = await request.json();
    
    const {
      fingerprint_hash,
      plugin_version,
      sketchup_version,
      ruby_version,
      os,
      architecture,
      session_duration,
      features_used,
      errors_count,
      api_calls,
      hardware_capabilities,
      locale
    } = body;
    
    // Зберігаємо телеметрію в БД
    const { data, error } = await supabase
      .from('telemetry')
      .insert({
        fingerprint_hash,
        plugin_version,
        sketchup_version,
        ruby_version,
        os,
        architecture,
        session_duration,
        features_used,
        errors_count,
        api_calls,
        hardware_capabilities,
        locale,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Telemetry save error:', error);
      // Не повертаємо помилку - телеметрія не критична
    }
    
    // Аналіз аномалій (асинхронно)
    detectAnomalies(fingerprint_hash, body).catch(err => {
      console.error('Anomaly detection error:', err);
    });
    
    return apiSuccess({ received: true });
    
  } catch (error) {
    console.error('Telemetry error:', error);
    // Повертаємо success навіть при помилці (не блокуємо плагін)
    return apiSuccess({ received: false });
  }
});

/**
 * Виявлення аномалій в телеметрії
 */
async function detectAnomalies(fingerprintHash: string, telemetry: any) {
  const supabase = await import('@/lib/supabase').then(m => m.createSupabaseClient());
  
  // 1. Перевірка: чи той самий fingerprint з різних locations
  const recentSessions = await supabase
    .from('telemetry')
    .select('*')
    .eq('fingerprint_hash', fingerprintHash)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())  // Останні 24 години
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (recentSessions.data && recentSessions.data.length > 5) {
    // Занадто багато сесій за 24 години - підозра
    await flagAnomaly(fingerprintHash, 'high_session_frequency', {
      sessions_24h: recentSessions.data.length
    });
  }
  
  // 2. Перевірка: чи змінюється OS/hardware занадто часто
  const osSwitches = new Set(recentSessions.data?.map(s => s.os)).size;
  if (osSwitches > 2) {
    // Той самий fingerprint на різних OS - підозра на підробку
    await flagAnomaly(fingerprintHash, 'os_switching', {
      different_os: osSwitches
    });
  }
  
  // 3. Перевірка: чи занадто багато помилок
  if (telemetry.errors_count > 50) {
    // Дуже багато помилок - можливо спроба злому
    await flagAnomaly(fingerprintHash, 'high_error_rate', {
      errors: telemetry.errors_count
    });
  }
  
  // 4. Перевірка: чи використовуються "підозрілі" features
  const suspiciousFeatures = ['debug_mode', 'bypass_validation', 'fake_license'];
  const hasSuspicious = telemetry.features_used?.some((f: string) => 
    suspiciousFeatures.includes(f)
  );
  
  if (hasSuspicious) {
    await flagAnomaly(fingerprintHash, 'suspicious_features', {
      features: telemetry.features_used
    });
  }
}

/**
 * Позначити аномалію
 */
async function flagAnomaly(
  fingerprintHash: string, 
  anomalyType: string, 
  details: any
) {
  const supabase = await import('@/lib/supabase').then(m => m.createSupabaseClient());
  
  await supabase.from('anomalies').insert({
    fingerprint_hash: fingerprintHash,
    anomaly_type: anomalyType,
    details,
    created_at: new Date().toISOString()
  });
  
  console.log(`🚨 Anomaly detected: ${anomalyType} for ${fingerprintHash}`);
}

export const dynamic = 'force-dynamic';


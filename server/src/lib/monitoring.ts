import { createClient } from '@supabase/supabase-js';
import { SecureLogger } from './secure-logger';

const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface MonitoringStats {
  total_plugins: number;
  active_plugins: number;
  blocked_plugins: number;
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  blocked_licenses: number;
  recent_heartbeats: number;
  failed_heartbeats: number;
  offline_plugins: number;
}

export interface Alert {
  type: 'WARNING' | 'ERROR' | 'INFO';
  message: string;
  timestamp: string;
  data?: any;
}

export class MonitoringService {
  private static alerts: Alert[] = [];
  private static readonly MAX_ALERTS = 1000;

  /**
   * Отримує статистику системи
   */
  static async getSystemStats(): Promise<MonitoringStats> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Статистика плагінів
      const [pluginsResult, licensesResult, userLicensesResult] = await Promise.all([
        supabase.from('plugins').select('*'),
        supabase.from('licenses').select('*'),
        supabase.from('user_licenses').select('*')
      ]);

      const plugins = pluginsResult.data || [];
      const licenses = licensesResult.data || [];
      const userLicenses = userLicensesResult.data || [];

      const stats: MonitoringStats = {
        total_plugins: plugins.length,
        active_plugins: plugins.filter(p => p.is_active).length,
        blocked_plugins: plugins.filter(p => p.is_blocked).length,
        total_licenses: licenses.length,
        active_licenses: userLicenses.filter(ul => ul.is_active).length,
        expired_licenses: licenses.filter(l => 
          l.expires_at && new Date(l.expires_at) < now
        ).length,
        blocked_licenses: userLicenses.filter(ul => !ul.is_active).length,
        recent_heartbeats: plugins.filter(p => 
          new Date(p.last_heartbeat) > oneHourAgo
        ).length,
        failed_heartbeats: 0, // Буде розраховано в майбутньому
        offline_plugins: plugins.filter(p => 
          new Date(p.last_heartbeat) < oneDayAgo
        ).length
      };

      return stats;
    } catch (error) {
      SecureLogger.error(error, 'MONITORING');
      throw error;
    }
  }

  /**
   * Перевіряє систему на аномалії
   */
  static async checkSystemHealth(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const stats = await this.getSystemStats();

    // Перевірка високого навантаження
    if (stats.total_plugins > 1000) {
      alerts.push({
        type: 'WARNING',
        message: 'High plugin count detected',
        timestamp: new Date().toISOString(),
        data: { total_plugins: stats.total_plugins }
      });
    }

    // Перевірка заблокованих плагінів
    if (stats.blocked_plugins > 10) {
      alerts.push({
        type: 'WARNING',
        message: 'High number of blocked plugins',
        timestamp: new Date().toISOString(),
        data: { blocked_plugins: stats.blocked_plugins }
      });
    }

    // Перевірка прострочених ліцензій
    if (stats.expired_licenses > 50) {
      alerts.push({
        type: 'WARNING',
        message: 'High number of expired licenses',
        timestamp: new Date().toISOString(),
        data: { expired_licenses: stats.expired_licenses }
      });
    }

    // Перевірка offline плагінів
    if (stats.offline_plugins > 100) {
      alerts.push({
        type: 'ERROR',
        message: 'High number of offline plugins',
        timestamp: new Date().toISOString(),
        data: { offline_plugins: stats.offline_plugins }
      });
    }

    // Перевірка активності
    if (stats.active_plugins === 0 && stats.total_plugins > 0) {
      alerts.push({
        type: 'ERROR',
        message: 'No active plugins detected',
        timestamp: new Date().toISOString(),
        data: { total_plugins: stats.total_plugins }
      });
    }

    // Зберігаємо алерти
    this.alerts.push(...alerts);
    
    // Обмежуємо кількість алертів
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }

    return alerts;
  }

  /**
   * Отримує останні алерти
   */
  static getRecentAlerts(limit: number = 50): Alert[] {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Очищає старі алерти
   */
  static clearOldAlerts(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > cutoff
    );
  }

  /**
   * Відстежує підозрілу активність
   */
  static async detectSuspiciousActivity(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    try {
      // Перевірка на spam heartbeat
      const { data: recentHeartbeats } = await supabase
        .from('plugins')
        .select('plugin_id, last_heartbeat, user_id')
        .gte('last_heartbeat', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('last_heartbeat', { ascending: false });

      if (recentHeartbeats) {
        // Групуємо по plugin_id
        const heartbeatCounts = recentHeartbeats.reduce((acc, hb) => {
          acc[hb.plugin_id] = (acc[hb.plugin_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Знаходимо підозрілу активність
        for (const [pluginId, count] of Object.entries(heartbeatCounts)) {
          if (count > 100) { // Більше 100 heartbeat за годину
            alerts.push({
              type: 'WARNING',
              message: 'Suspicious heartbeat activity detected',
              timestamp: new Date().toISOString(),
              data: { plugin_id: pluginId, heartbeat_count: count }
            });
          }
        }
      }

      // Перевірка на множинні реєстрації з одного IP
      const { data: recentRegistrations } = await supabase
        .from('user_licenses')
        .select('email, created_at')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (recentRegistrations) {
        const registrationCounts = recentRegistrations.reduce((acc, reg) => {
          acc[reg.email] = (acc[reg.email] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        for (const [email, count] of Object.entries(registrationCounts)) {
          if (count > 5) { // Більше 5 реєстрацій за годину
            alerts.push({
              type: 'WARNING',
              message: 'Multiple registrations from same email',
              timestamp: new Date().toISOString(),
              data: { email, registration_count: count }
            });
          }
        }
      }

    } catch (error) {
      SecureLogger.error(error, 'MONITORING');
    }

    return alerts;
  }

  /**
   * Генерує звіт про стан системи
   */
  static async generateSystemReport(): Promise<{
    timestamp: string;
    stats: MonitoringStats;
    alerts: Alert[];
    health_score: number;
  }> {
    const stats = await this.getSystemStats();
    const healthAlerts = await this.checkSystemHealth();
    const suspiciousAlerts = await this.detectSuspiciousActivity();
    const allAlerts = [...healthAlerts, ...suspiciousAlerts];

    // Розраховуємо health score (0-100)
    let healthScore = 100;
    
    // Штрафуємо за заблоковані плагіни
    healthScore -= Math.min(stats.blocked_plugins * 0.1, 20);
    
    // Штрафуємо за offline плагіни
    healthScore -= Math.min(stats.offline_plugins * 0.05, 30);
    
    // Штрафуємо за прострочені ліцензії
    healthScore -= Math.min(stats.expired_licenses * 0.02, 15);
    
    // Штрафуємо за алерти
    healthScore -= Math.min(allAlerts.length * 2, 25);

    healthScore = Math.max(0, healthScore);

    return {
      timestamp: new Date().toISOString(),
      stats,
      alerts: allAlerts,
      health_score: Math.round(healthScore)
    };
  }
}

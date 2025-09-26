import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

// Отримання статистики моніторингу
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const report = searchParams.get('report') === 'true';
    const alerts = searchParams.get('alerts') === 'true';
    const health = searchParams.get('health') === 'true';

    let responseData: any = {};

    if (report) {
      // Повний звіт
      responseData = await MonitoringService.generateSystemReport();
    } else if (alerts) {
      // Тільки алерти
      const recentAlerts = MonitoringService.getRecentAlerts(100);
      responseData = { alerts: recentAlerts };
    } else if (health) {
      // Перевірка здоров'я системи
      const healthAlerts = await MonitoringService.checkSystemHealth();
      responseData = { 
        health_checks: healthAlerts,
        suspicious_activity: await MonitoringService.detectSuspiciousActivity()
      };
    } else {
      // Базова статистика
      responseData = {
        stats: await MonitoringService.getSystemStats(),
        recent_alerts: MonitoringService.getRecentAlerts(20)
      };
    }

    SecureLogger.info('Monitoring data requested', { 
      report, 
      alerts, 
      health 
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_MONITORING');
  }
}

// Очищення старих алертів
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    MonitoringService.clearOldAlerts(hours);

    SecureLogger.info('Old alerts cleared', { hours }, 'ADMIN');

    return NextResponse.json({
      success: true,
      message: `Alerts older than ${hours} hours have been cleared`
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_CLEAR_ALERTS');
  }
}

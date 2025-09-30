import { NextResponse } from 'next/server';
import { LicenseRepository } from '@/lib/database/repositories/license.repository';
import { UserLicenseRepository } from '@/lib/database/repositories/user-license.repository';
import { PluginRepository } from '@/lib/database/repositories/plugin.repository';
import { createSuccessResponse, getNoCacheHeaders } from '@/lib/utils/response.util';
import { Logger } from '@/lib/utils/logger.util';

export async function GET() {
  try {
    Logger.info('Fetching all dashboard data');

    // Створюємо репозиторії
    const licenseRepo = new LicenseRepository();
    const userLicenseRepo = new UserLicenseRepository();
    const pluginRepo = new PluginRepository();

    // Отримуємо всі дані
    const [plugins, licenses, userLicenses] = await Promise.all([
      pluginRepo.findAll(),
      licenseRepo.findAll(),
      userLicenseRepo.findAll()
    ]);

    // Формуємо summary
    const summary = {
      total_plugins: plugins.length,
      total_licenses: licenses.length,
      total_activations: userLicenses.length,
      active_plugins: plugins.filter(p => p.is_active).length,
      blocked_plugins: plugins.filter(p => p.is_blocked).length,
      active_licenses: licenses.filter(l => l.is_active).length
    };

    Logger.info('Dashboard data fetched successfully', { summary });

    return NextResponse.json(
      createSuccessResponse({
        plugins,
        licenses,
        user_licenses: userLicenses,
        summary
      }, 'All data fetched successfully'),
      { 
        status: 200,
        headers: getNoCacheHeaders()
      }
    );

  } catch (error) {
    Logger.error('Error fetching dashboard data', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: getNoCacheHeaders()
      }
    );
  }
}
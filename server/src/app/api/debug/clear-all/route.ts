import { NextResponse } from 'next/server';
import { LicenseRepository } from '@/lib/database/repositories/license.repository';
import { UserLicenseRepository } from '@/lib/database/repositories/user-license.repository';
import { PluginRepository } from '@/lib/database/repositories/plugin.repository';
import { createSuccessResponse, getNoCacheHeaders } from '@/lib/utils/response.util';
import { Logger } from '@/lib/utils/logger.util';

export async function POST() {
  try {
    Logger.info('Starting database cleanup');

    // Створюємо репозиторії
    const licenseRepo = new LicenseRepository();
    const userLicenseRepo = new UserLicenseRepository();
    const pluginRepo = new PluginRepository();

    const results = [];

    // Очищаємо всі таблиці в правильному порядку
    try {
      Logger.info('Clearing user_licenses table');
      const userLicenses = await userLicenseRepo.findAll();
      for (const userLicense of userLicenses) {
        await userLicenseRepo.delete(userLicense.id);
      }
      results.push({ table: 'user_licenses', success: true, deleted: userLicenses.length });
    } catch (error) {
      Logger.error('Error clearing user_licenses', error as Error);
      results.push({ table: 'user_licenses', success: false, error: (error as Error).message });
    }

    try {
      Logger.info('Clearing plugins table');
      const plugins = await pluginRepo.findAll();
      for (const plugin of plugins) {
        await pluginRepo.delete(plugin.id);
      }
      results.push({ table: 'plugins', success: true, deleted: plugins.length });
    } catch (error) {
      Logger.error('Error clearing plugins', error as Error);
      results.push({ table: 'plugins', success: false, error: (error as Error).message });
    }

    try {
      Logger.info('Clearing licenses table');
      const licenses = await licenseRepo.findAll();
      for (const license of licenses) {
        await licenseRepo.delete(license.id);
      }
      results.push({ table: 'licenses', success: true, deleted: licenses.length });
    } catch (error) {
      Logger.error('Error clearing licenses', error as Error);
      results.push({ table: 'licenses', success: false, error: (error as Error).message });
    }

    // Перевіряємо фінальні результати
    const finalCounts = {
      plugins: (await pluginRepo.findAll()).length,
      licenses: (await licenseRepo.findAll()).length,
      user_licenses: (await userLicenseRepo.findAll()).length
    };

    Logger.info('Database cleanup completed', { results, finalCounts });

    return NextResponse.json(
      createSuccessResponse({
        results,
        final_counts: finalCounts
      }, 'Database cleared successfully'),
      { 
        status: 200,
        headers: getNoCacheHeaders()
      }
    );

  } catch (error) {
    Logger.error('Error clearing database', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear database',
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
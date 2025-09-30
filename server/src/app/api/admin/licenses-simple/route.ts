import { NextResponse } from 'next/server';
import { LicenseRepository } from '@/lib/database/repositories/license.repository';
import { createSuccessResponse, getNoCacheHeaders } from '@/lib/utils/response.util';
import { Logger } from '@/lib/utils/logger.util';

export async function GET() {
  try {
    Logger.info('Fetching all licenses');

    // Створюємо репозиторій
    const licenseRepo = new LicenseRepository();

    // Отримуємо всі ліцензії
    const licenses = await licenseRepo.findAll();

    Logger.info('Licenses fetched successfully', { count: licenses.length });

    return NextResponse.json(
      createSuccessResponse({
        licenses
      }, 'Licenses fetched successfully'),
      { 
        status: 200,
        headers: getNoCacheHeaders()
      }
    );

  } catch (error) {
    Logger.error('Error fetching licenses', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch licenses',
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
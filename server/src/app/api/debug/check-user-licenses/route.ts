import { NextResponse } from 'next/server';
import { UserLicenseRepository } from '@/lib/database/repositories/user-license.repository';
import { createSuccessResponse, getNoCacheHeaders } from '@/lib/utils/response.util';
import { Logger } from '@/lib/utils/logger.util';

export async function GET() {
  try {
    Logger.info('Fetching all user licenses');

    // Створюємо репозиторій
    const userLicenseRepo = new UserLicenseRepository();

    // Отримуємо всі user licenses
    const userLicenses = await userLicenseRepo.findAll();

    Logger.info('User licenses fetched successfully', { count: userLicenses.length });

    return NextResponse.json(
      createSuccessResponse({
        userLicenses
      }, 'User licenses fetched successfully'),
      { 
        status: 200,
        headers: getNoCacheHeaders()
      }
    );

  } catch (error) {
    Logger.error('Error fetching user licenses', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user licenses',
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
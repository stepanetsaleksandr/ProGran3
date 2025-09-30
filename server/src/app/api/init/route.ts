import { NextResponse } from 'next/server';
import { runMigration001 } from '@/lib/database/migrations/001-create-tables';
import { createSuccessResponse, getNoCacheHeaders } from '@/lib/utils/response.util';
import { Logger } from '@/lib/utils/logger.util';

export async function GET() {
  try {
    Logger.info('Initializing database');

    // Запускаємо міграцію
    await runMigration001();
    
    Logger.info('Database initialization completed successfully');

    return NextResponse.json(
      createSuccessResponse({
        message: 'Database initialized successfully',
        tables: ['plugins', 'licenses', 'user_licenses']
      }),
      { 
        status: 200,
        headers: getNoCacheHeaders()
      }
    );
  } catch (error) {
    Logger.error('Database initialization failed', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database initialization failed',
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
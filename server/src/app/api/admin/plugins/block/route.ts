import { NextRequest, NextResponse } from 'next/server';
import { blockPlugin } from '@/lib/database';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

// Блокування плагіна
export async function POST(request: NextRequest) {
  try {
    const { plugin_id } = await request.json();

    if (!plugin_id) {
      return NextResponse.json({
        success: false,
        error: 'Plugin ID is required'
      }, { status: 400 });
    }

    const result = await blockPlugin(plugin_id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to block plugin'
      }, { status: 500 });
    }

    SecureLogger.info('Plugin blocked by admin', { 
      plugin_id 
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      message: 'Plugin blocked successfully',
      data: { plugin_id }
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_BLOCK_PLUGIN');
  }
}

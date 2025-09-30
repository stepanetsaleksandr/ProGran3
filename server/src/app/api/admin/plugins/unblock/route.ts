import { NextRequest, NextResponse } from 'next/server';
import { unblockPlugin } from '@/lib/database';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

// Розблокування плагіна
export async function POST(request: NextRequest) {
  try {
    const { plugin_id } = await request.json();

    if (!plugin_id) {
      return NextResponse.json({
        success: false,
        error: 'Plugin ID is required'
      }, { status: 400 });
    }

    const result = await unblockPlugin(plugin_id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to unblock plugin'
      }, { status: 500 });
    }

    SecureLogger.info('Plugin unblocked by admin', { 
      plugin_id 
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      message: 'Plugin unblocked successfully',
      data: { plugin_id }
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_UNBLOCK_PLUGIN');
  }
}

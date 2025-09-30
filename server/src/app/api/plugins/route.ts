import { NextRequest, NextResponse } from 'next/server';
import { PluginRepository } from '@/lib/database/repositories/plugin.repository';
import { handleApiError, createSuccessResponse, getNoCacheHeaders } from '@/lib/utils/response.util';
import { Logger } from '@/lib/utils/logger.util';

export async function GET(request: NextRequest) {
  try {
    Logger.info('Fetching all plugins');

    // Створюємо репозиторій
    const pluginRepo = new PluginRepository();

    // Отримуємо всі плагіни
    const plugins = await pluginRepo.findAll();

    // Формуємо статистику
    const stats = {
      total: plugins.length,
      active: plugins.filter(p => p.is_active).length,
      blocked: plugins.filter(p => p.is_blocked).length,
      last_updated: new Date().toISOString()
    };

    Logger.info('Plugins fetched successfully', { count: plugins.length });

    return NextResponse.json(
      createSuccessResponse({
        plugins,
        stats
      }, 'Plugins fetched successfully'),
      { 
        status: 200,
        headers: getNoCacheHeaders()
      }
    );

  } catch (error) {
    Logger.error('Error fetching plugins', error as Error);
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('plugin_id');

    if (!pluginId) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_PLUGIN_ID',
          message: 'Plugin ID is required'
        },
        { 
          status: 400,
          headers: getNoCacheHeaders()
        }
      );
    }

    Logger.info('Deleting plugin', { plugin_id: pluginId });

    // Створюємо репозиторій
    const pluginRepo = new PluginRepository();

    // Видаляємо плагін
    const success = await pluginRepo.deleteByPluginId(pluginId);

    if (success) {
      Logger.info('Plugin deleted successfully', { plugin_id: pluginId });
      return NextResponse.json(
        createSuccessResponse({ plugin_id: pluginId }, 'Plugin deleted successfully'),
        { 
          status: 200,
          headers: getNoCacheHeaders()
        }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'DELETE_FAILED',
          message: 'Failed to delete plugin'
        },
        { 
          status: 500,
          headers: getNoCacheHeaders()
        }
      );
    }

  } catch (error) {
    Logger.error('Error deleting plugin', error as Error);
    return handleApiError(error);
  }
}

// Обробка OPTIONS запиту для CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
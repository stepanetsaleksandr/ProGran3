import { NextRequest, NextResponse } from 'next/server';
import { blockPlugin, unblockPlugin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plugin_id, action } = body;

    // Валідація обов'язкових полів
    if (!plugin_id || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: plugin_id and action'
      }, { status: 400 });
    }

    // Валідація plugin_id формату
    if (!plugin_id.match(/^progran3-[a-z0-9-]+$/)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plugin_id format'
      }, { status: 400 });
    }

    // Валідація action
    if (!['block', 'unblock'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Must be "block" or "unblock"'
      }, { status: 400 });
    }

    let result;
    if (action === 'block') {
      // Debug логування (тільки в development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Blocking plugin: ${plugin_id}`);
      }
      result = await blockPlugin(plugin_id);
      if (process.env.NODE_ENV === 'development') {
        console.log('Block result:', result);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Unblocking plugin: ${plugin_id}`);
      }
      result = await unblockPlugin(plugin_id);
      if (process.env.NODE_ENV === 'development') {
        console.log('Unblock result:', result);
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Plugin ${action === 'block' ? 'blocked' : 'unblocked'} successfully`,
        plugin_id: plugin_id,
        action: action
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || `Failed to ${action} plugin`
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Обробка OPTIONS запиту для CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

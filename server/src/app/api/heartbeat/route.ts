import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Отримуємо IP адресу клієнта
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Парсимо дані з запиту
    let data;
    try {
      data = await request.json();
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log('Processing heartbeat:', { plugin_id: data.plugin_id, ipAddress });

    // Створюємо Supabase клієнт
    const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://default.supabase.co';
    const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-key';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Обробляємо heartbeat
    let isBlocked = false;
    let message = 'Heartbeat updated successfully';

    if (data.action === 'plugin_shutdown') {
      // Позначаємо плагін як неактивний
      const { error: updateError } = await supabase
        .from('plugins')
        .update({ 
          is_active: false,
          last_heartbeat: new Date().toISOString()
        })
        .eq('plugin_id', data.plugin_id);
      
      if (updateError) {
        console.error('Error updating plugin status:', updateError);
      }
      
      message = 'Plugin shutdown signal received';
      console.log(message, { pluginId: data.plugin_id });
    } else {
      // Оновлюємо або створюємо запис плагіна
      const { data: plugin, error: upsertError } = await supabase
        .from('plugins')
        .upsert({
          plugin_id: data.plugin_id,
          plugin_name: data.plugin_name,
          version: data.version,
          user_id: data.user_id,
          computer_name: data.computer_name,
          system_info: data.system_info,
          last_heartbeat: data.timestamp,
          is_active: true,
          is_blocked: isBlocked,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'plugin_id',
          ignoreDuplicates: false
        })
        .select('id, plugin_id, last_heartbeat, is_active, is_blocked')
        .single();

      if (upsertError) {
        console.error('Error upserting plugin:', upsertError);
        return NextResponse.json(
          { success: false, error: 'Failed to update plugin' },
          { status: 500 }
        );
      }

      console.log('Plugin upserted successfully:', { 
        pluginId: plugin.plugin_id, 
        isActive: plugin.is_active, 
        isBlocked: plugin.is_blocked 
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: message,
        data: {
          plugin: {
            id: 1,
            plugin_id: data.plugin_id,
            last_heartbeat: data.timestamp,
            is_active: !isBlocked,
            is_blocked: isBlocked
          }
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, private',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
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
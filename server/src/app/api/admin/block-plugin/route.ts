import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Блокування/розблокування плагіна
export async function POST(request: NextRequest) {
  try {
    const { plugin_id, action, reason } = await request.json();

    // Валідація
    ErrorHandler.validateRequiredFields({ plugin_id, action }, ['plugin_id', 'action']);
    ErrorHandler.validatePluginId(plugin_id);
    
    if (!['block', 'unblock'].includes(action)) {
      throw new Error('Invalid action. Must be "block" or "unblock"');
    }

    // Блокування/розблокування плагіна
    const { data: plugin, error } = await supabase
      .from('plugins')
      .update({ 
        is_blocked: action === 'block',
        is_active: action === 'unblock', // Розблокований плагін стає активним
        updated_at: new Date().toISOString()
      })
      .eq('plugin_id', plugin_id)
      .select('plugin_id, plugin_name, user_id, computer_name, is_blocked, is_active')
      .single();

    if (error) {
      throw new Error('Failed to update plugin status');
    }

    if (!plugin) {
      throw new Error('Plugin not found');
    }

    SecureLogger.info(`Plugin ${action}ed by admin`, { 
      plugin_id,
      plugin_name: plugin.plugin_name,
      user_id: plugin.user_id,
      computer_name: plugin.computer_name,
      action,
      reason
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      message: `Plugin ${action}ed successfully`,
      action,
      plugin: {
        plugin_id: plugin.plugin_id,
        plugin_name: plugin.plugin_name,
        is_blocked: plugin.is_blocked,
        is_active: plugin.is_active
      }
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_BLOCK_PLUGIN');
  }
}

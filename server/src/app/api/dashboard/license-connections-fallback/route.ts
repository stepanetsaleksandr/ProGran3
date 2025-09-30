import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://default.supabase.co';
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Отримуємо всі плагіни
    const { data: plugins, error: pluginsError } = await supabase
      .from('plugins')
      .select('*')
      .order('last_heartbeat', { ascending: false });

    if (pluginsError) {
      console.error('Error fetching plugins:', pluginsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plugins' },
        { status: 500 }
      );
    }

    // Отримуємо всі user_licenses
    const { data: userLicenses, error: userLicensesError } = await supabase
      .from('user_licenses')
      .select('*')
      .order('activated_at', { ascending: false });

    if (userLicensesError) {
      console.error('Error fetching user licenses:', userLicensesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user licenses' },
        { status: 500 }
      );
    }

    // Отримуємо всі licenses
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (licensesError) {
      console.error('Error fetching licenses:', licensesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch licenses' },
        { status: 500 }
      );
    }

    // Формуємо зв'язки між ліцензіями та плагінами
    const connections = userLicenses?.map(userLicense => {
      const license = licenses?.find(l => l.license_key === userLicense.license_key);
      const plugin = plugins?.find(p => p.user_id === userLicense.email);
      
      return {
        id: userLicense.id,
        email: userLicense.email,
        license_key: userLicense.license_key,
        hardware_id: userLicense.hardware_id,
        activated_at: userLicense.activated_at,
        last_heartbeat: userLicense.last_heartbeat,
        license_info: license ? {
          id: license.id,
          license_type: license.license_type,
          max_activations: license.max_activations,
          days_valid: license.days_valid,
          created_at: license.created_at
        } : null,
        plugin_info: plugin ? {
          id: plugin.id,
          plugin_id: plugin.plugin_id,
          plugin_name: plugin.plugin_name,
          version: plugin.version,
          computer_name: plugin.computer_name,
          is_active: plugin.is_active,
          is_blocked: plugin.is_blocked,
          last_heartbeat: plugin.last_heartbeat
        } : null
      };
    }) || [];

    // Статистика
    const stats = {
      total_connections: connections.length,
      active_plugins: plugins?.filter(p => p.is_active && !p.is_blocked).length || 0,
      blocked_plugins: plugins?.filter(p => p.is_blocked).length || 0,
      total_licenses: licenses?.length || 0,
      activated_licenses: userLicenses?.length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        connections,
        stats
      }
    });

  } catch (error) {
    console.error('Error in license-connections-fallback:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

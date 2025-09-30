import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '@/lib/error-handler';
import { SecureLogger } from '@/lib/secure-logger';

const supabaseUrl = process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Отримання всіх плагінів з детальною інформацією
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const blocked = searchParams.get('blocked');

    let query = supabase
      .from('plugins')
      .select('*')
      .order('last_heartbeat', { ascending: false });

    // Фільтрація за статусом
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Фільтрація за блокуванням
    if (blocked === 'true') {
      query = query.eq('is_blocked', true);
    } else if (blocked === 'false') {
      query = query.eq('is_blocked', false);
    }

    // Пагінація
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: plugins, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch plugins');
    }

    // Розраховуємо статистику
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      total: count || 0,
      active: plugins?.filter(p => p.is_active).length || 0,
      blocked: plugins?.filter(p => p.is_blocked).length || 0,
      recent: plugins?.filter(p => new Date(p.last_heartbeat) > oneHourAgo).length || 0,
      offline: plugins?.filter(p => new Date(p.last_heartbeat) < oneDayAgo).length || 0
    };

    SecureLogger.info('Admin plugins fetched', { 
      page, 
      limit, 
      total: count,
      filters: { status, blocked }
    }, 'ADMIN');

    return NextResponse.json({
      success: true,
      data: {
        plugins: plugins || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        stats
      }
    });

  } catch (error) {
    return ErrorHandler.handle(error, 'ADMIN_PLUGINS');
  }
}

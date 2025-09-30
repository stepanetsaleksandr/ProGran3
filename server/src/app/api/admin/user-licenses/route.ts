import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
if (!process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.SB_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: userLicenses, error } = await supabase
      .from('user_licenses')
      .select('*')
      .order('activated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user licenses:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user licenses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user_licenses: userLicenses || []
      }
    });

  } catch (error) {
    console.error('Error in user-licenses GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

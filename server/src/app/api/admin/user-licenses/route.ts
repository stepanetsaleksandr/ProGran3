import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
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

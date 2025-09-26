import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      STORAGE_SUPABASE_URL: !!process.env.STORAGE_SUPABASE_URL,
      STORAGE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      env: envCheck,
      hasAnySupabase: Object.values(envCheck).some(Boolean)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment variables',
      message: (error as Error).message
    }, { status: 500 });
  }
}

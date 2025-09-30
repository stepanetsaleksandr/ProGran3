import { NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function GET() {
  try {

    // Отримати всі ліцензії
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch licenses',
        message: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('Fetched licenses:', licenses);

    return NextResponse.json({
      success: true,
      message: 'Licenses fetched successfully',
      count: licenses?.length || 0,
      licenses: licenses || []
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch licenses',
      message: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

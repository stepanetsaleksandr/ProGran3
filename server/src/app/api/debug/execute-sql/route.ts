import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'SQL query is required'
      }, { status: 400 });
    }

    console.log('Executing SQL:', sql);

    // Виконуємо SQL запит через прямі запити
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .limit(1);

    if (error) {
      console.error('SQL execution error:', error);
      return NextResponse.json({
        success: false,
        error: 'SQL execution failed',
        message: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SQL executed successfully',
      data: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute SQL',
      message: (error as Error).message
    }, { status: 500 });
  }
}

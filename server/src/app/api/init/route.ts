import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';

export async function GET() {
  try {
    await initializeDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Test register endpoint called with:', body);
    
    // Простий тест без бази даних
    return NextResponse.json({
      success: true,
      message: 'Test registration successful',
      data: {
        email: body.email,
        license_key: body.license_key,
        hardware_id: body.hardware_id,
        activated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test register error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test registration failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

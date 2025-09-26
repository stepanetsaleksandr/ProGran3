import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Простий тест без бази даних
    const testLicense = {
      id: Math.floor(Math.random() * 1000),
      license_key: body.license_key || 'TEST-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      license_type: 'standard',
      days_valid: body.days_valid || 365,
      max_activations: body.max_activations || 1,
      is_active: body.is_active !== false,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Test license created successfully (without database)',
      license: testLicense
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create test license',
      message: (error as Error).message
    }, { status: 500 });
  }
}

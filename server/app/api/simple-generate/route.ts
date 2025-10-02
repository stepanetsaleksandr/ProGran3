import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration_days, description } = body;

    console.log('Simple generate request:', { duration_days, description });

    if (!duration_days || duration_days < 1) {
      return NextResponse.json({ success: false, error: 'Duration must be at least 1 day' }, { status: 400 });
    }

    // Generate unique license key
    const generateLicenseKey = () => {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `PROGRAN3-${year}-${randomPart}-${timestamp}`;
    };

    const license_key = generateLicenseKey();
    console.log('Generated license key:', license_key);

    // Return mock data without database
    const mockLicense = {
      id: `mock-${Date.now()}`,
      license_key: license_key,
      duration_days: duration_days,
      description: description || `${duration_days} days license`,
      status: 'generated',
      created_at: new Date().toISOString()
    };

    console.log('Mock license created:', mockLicense);

    return NextResponse.json({ 
      success: true, 
      data: mockLicense,
      message: 'License key generated successfully (mock mode)'
    });
  } catch (error) {
    console.error('Simple generate error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

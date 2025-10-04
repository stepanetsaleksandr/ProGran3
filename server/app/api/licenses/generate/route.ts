import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration_days, description } = body;

    console.log('Generate license request:', { duration_days, description });

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

    // Create license record (not activated yet)
    const supabase = createSupabaseClient();
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        license_key,
        duration_days,
        description: description || `${duration_days} days license`,
        status: 'generated'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('License created successfully:', license);

    return NextResponse.json({ 
      success: true, 
      data: {
        id: license.id,
        license_key: license.license_key,
        duration_days: license.duration_days,
        description: license.description,
        status: license.status,
        created_at: license.created_at
      }
    });
  } catch (error) {
    console.error('Generate license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

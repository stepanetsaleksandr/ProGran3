import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    console.log('Attempting to delete license with ID:', id);

    // Delete from licenses table
    const { data: licensesData, error: licensesError } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id)
      .select();

    if (licensesError) {
      console.error('Licenses deletion error:', licensesError);
      throw licensesError;
    }

    console.log('Successfully deleted from licenses table:', licensesData);
    return NextResponse.json({ 
      success: true, 
      message: 'License deleted from licenses table',
      data: licensesData
    });
  } catch (error) {
    console.error('Delete license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

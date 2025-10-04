import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    // Delete from licenses table
    const { error: licensesError } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);

    if (licensesError) {
      console.error('Licenses deletion error:', licensesError);
      throw licensesError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'License deleted successfully' 
    });
  } catch (error) {
    console.error('Delete license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    // Get from licenses table
    const { data: license, error: licensesError } = await supabase
      .from('licenses')
      .select(`
        *,
        users(email, name)
      `)
      .eq('id', id)
      .single();

    if (licensesError) {
      console.error('Licenses fetch error:', licensesError);
      throw licensesError;
    }

    return NextResponse.json({ success: true, data: license });
  } catch (error) {
    console.error('Get license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient();
    const { id } = params;
    const body = await request.json();
    const { duration_days, status, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'License ID is required' }, { status: 400 });
    }

    // Update licenses table
    const { data: license, error: licensesError } = await supabase
      .from('licenses')
      .update({
        duration_days,
        status,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (licensesError) {
      console.error('Licenses update error:', licensesError);
      throw licensesError;
    }

    return NextResponse.json({ success: true, data: license });
  } catch (error) {
    console.error('Update license error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
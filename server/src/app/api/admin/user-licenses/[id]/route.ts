import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User license ID is required'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Видаляємо user_license
    const { error } = await supabase
      .from('user_licenses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user license:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete user license',
        details: error.message
      }, { status: 500 });
    }
    
    console.log('User license deleted successfully:', id);
    
    return NextResponse.json({
      success: true,
      message: 'User license deleted successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}

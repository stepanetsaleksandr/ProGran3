import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Перевірка змінних середовища
const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// DELETE - видалення ліцензії
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const licenseId = params.id;

    console.log('Deleting license:', licenseId);

    // Спочатку отримуємо license_key з ліцензії
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('id', licenseId)
      .single();

    if (licenseError) {
      console.error('Error fetching license:', licenseError);
      return NextResponse.json({
        success: false,
        error: 'License not found'
      }, { status: 404 });
    }

    // Видаляємо всі user_licenses для цієї ліцензії
    const { data: userLicenses, error: userLicensesError } = await supabase
      .from('user_licenses')
      .select('id')
      .eq('license_key', license.license_key);

    if (userLicensesError) {
      console.error('Error fetching user licenses:', userLicensesError);
    } else if (userLicenses && userLicenses.length > 0) {
      // Видаляємо всі user_licenses для цієї ліцензії
      const { error: deleteUserLicensesError } = await supabase
        .from('user_licenses')
        .delete()
        .eq('license_key', license.license_key);

      if (deleteUserLicensesError) {
        console.error('Error deleting user licenses:', deleteUserLicensesError);
        return NextResponse.json({
          success: false,
          error: 'Failed to delete user licenses'
        }, { status: 500 });
      }

      console.log(`Deleted ${userLicenses.length} user license(s) for license_key: ${license.license_key}`);
    }

    // Тепер видаляємо саму ліцензію
    const { data: deletedLicense, error: deleteError } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId)
      .select()
      .single();

    if (deleteError) {
      console.error('Error deleting license:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete license'
      }, { status: 500 });
    }

    console.log('License deleted successfully:', deletedLicense);

    return NextResponse.json({
      success: true,
      message: 'License deleted successfully',
      data: deletedLicense
    });

  } catch (error) {
    console.error('Unexpected error in license deletion:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}

// GET - отримання конкретної ліцензії
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const licenseId = params.id;

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (error) {
      console.error('Error fetching license:', error);
      return NextResponse.json({
        success: false,
        error: 'License not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: license
    });

  } catch (error) {
    console.error('Unexpected error in license fetch:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}

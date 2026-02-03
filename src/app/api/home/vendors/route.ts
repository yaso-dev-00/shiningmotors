import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Cache for 5-10 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: vendors, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_vendor', true)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch vendors',
        data: [],
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: vendors || [],
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch vendors',
        data: [],
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch service bookings with related data
    const { data: bookings, error: bookingsError } = await supabase
      .from('service_bookings')
      .select(`
        *,
        service:services(*),
        vendor:profiles!service_bookings_vendor_id_fkey(username, full_name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching service bookings:', bookingsError);
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: bookings || [] });
  } catch (error: any) {
    console.error('Error in GET /api/service-bookings/[userId]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch service bookings' },
      { status: 500 }
    );
  }
}


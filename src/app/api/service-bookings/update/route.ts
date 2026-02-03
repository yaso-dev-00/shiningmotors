import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, status } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Update booking status and ensure user can only update their own bookings
    const { data, error } = await supabase
      .from('service_bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service booking:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Booking not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error('Error in PATCH /api/service-bookings/update:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update service booking' },
      { status: 500 }
    );
  }
}








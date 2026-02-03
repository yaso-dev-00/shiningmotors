import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Cache for 5-10 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', now)
      .eq('status', 'published')
      .order('start_date', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch events',
        data: [],
      }, { status: 500 });
    }

    // Add countdown data
    const eventsWithCountdown = (events || []).map((event: any) => {
      const startDate = new Date(event.start_date);
      const now = new Date();
      const diff = startDate.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        ...event,
        countdown: {
          days,
          hours,
          minutes,
          seconds,
          total: diff,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: eventsWithCountdown,
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch events',
        data: [],
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Cache for 1 minute (live activity)
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createServerClient();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneDayAgoISO = oneDayAgo.toISOString();

    // Get recent purchases
    const { data: recentPurchases, error: purchasesError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          product:products(id, name)
        ),
        profiles:user_id(id, username, full_name)
      `)
      .gte('created_at', oneDayAgoISO)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get new events
    const { data: newEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('created_at', oneDayAgoISO)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get popular posts
    const { data: popularPosts, error: postsError } = await supabase
      .from('posts')
      .select('*, profile:user_id(id, username, full_name, avatar_url)')
      .gte('created_at', oneDayAgoISO)
      .order('likes_count', { ascending: false })
      .limit(3);

    return NextResponse.json({
      success: true,
      data: {
        recentPurchases: recentPurchases || [],
        newEvents: newEvents || [],
        popularPosts: popularPosts || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch activity',
        data: {
          recentPurchases: [],
          newEvents: [],
          popularPosts: [],
        },
      },
      { status: 500 }
    );
  }
}


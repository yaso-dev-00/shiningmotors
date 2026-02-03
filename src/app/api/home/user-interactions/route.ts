import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { shopApi } from '@/integrations/supabase/modules/shop';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = req.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '') || null;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        data: {
          recentViews: [],
          recentSearches: [],
          recentCartAdds: [],
          topCategories: [],
          activitySummary: {
            viewsThisWeek: 0,
            cartItems: 0,
            upcomingEvents: 0,
            recentOrders: 0,
          },
        },
      }, { status: 401 });
    }

    // Get recent views
    const { data: views, error: viewsError } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('item_id, metadata, created_at')
      .eq('user_id', userId)
      .eq('interaction_type', 'view')
      .eq('item_type', 'product')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent searches
    const { data: searches, error: searchesError } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('interaction_type', 'search')
      .order('created_at', { ascending: false })
      .limit(8);

    // Get recent cart adds
    const { data: cartAdds, error: cartAddsError } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('item_id, metadata, created_at')
      .eq('user_id', userId)
      .eq('interaction_type', 'add_to_cart')
      .eq('item_type', 'product')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get top categories
    const { data: categoryData, error: categoryError } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('metadata')
      .eq('user_id', userId)
      .eq('interaction_type', 'view')
      .eq('item_type', 'product');

    // Process category data
    const categoryCounts: Record<string, number> = {};
    // @ts-ignore - user_interactions table not in types
    categoryData?.forEach((item: any) => {
      const category = (item.metadata as any)?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Get activity summary
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { count: viewsThisWeek } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('interaction_type', 'view')
      .gte('created_at', oneWeekAgo.toISOString());

    const { count: cartItems } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: upcomingEvents } = await supabase
      .from('event_registrations')
      .select('*, events!inner(start_date)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('events.start_date', new Date().toISOString());

    const { count: recentOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneMonthAgo.toISOString());

    // Fetch product details for recent views
    // @ts-ignore - user_interactions table not in types
    const productIds = views?.map((v: any) => v.item_id).filter(Boolean) || [];
    const recentViewsProducts = productIds.length > 0
      ? (await Promise.all(
          productIds.slice(0, 8).map(async (id) => {
            const result = await shopApi.products.getById(id);
            return result.data;
          })
        )).filter(Boolean)
      : [];

    // Fetch product details for cart adds
    // @ts-ignore - user_interactions table not in types
    const cartProductIds = cartAdds?.map((c: any) => c.item_id).filter(Boolean) || [];
    const recentCartAddsProducts = cartProductIds.length > 0
      ? (await Promise.all(
          cartProductIds.slice(0, 8).map(async (id) => {
            const result = await shopApi.products.getById(id);
            return result.data;
          })
        )).filter(Boolean)
      : [];

    // Extract unique search queries
    // @ts-ignore - user_interactions table not in types
    const uniqueSearches = Array.from(
      new Set(
        searches?.map((s: any) => (s.metadata as any)?.query).filter(Boolean) || []
      )
    ).slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        recentViews: recentViewsProducts.filter(Boolean),
        recentSearches: uniqueSearches,
        recentCartAdds: recentCartAddsProducts.filter(Boolean),
        topCategories,
        activitySummary: {
          viewsThisWeek: viewsThisWeek || 0,
          cartItems: cartItems || 0,
          upcomingEvents: upcomingEvents || 0,
          recentOrders: recentOrders || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching user interactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch user interactions',
        data: {
          recentViews: [],
          recentSearches: [],
          recentCartAdds: [],
          topCategories: [],
          activitySummary: {
            viewsThisWeek: 0,
            cartItems: 0,
            upcomingEvents: 0,
            recentOrders: 0,
          },
        },
      },
      { status: 500 }
    );
  }
}


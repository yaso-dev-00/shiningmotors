import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Cache for 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createServerClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get member count
    const { count: memberCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get today's views
    const { count: todayViews } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)
      .eq('interaction_type', 'view');

    // Get today's orders
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    // Get active vendors
    const { count: activeVendors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_vendor', true);

    return NextResponse.json({
      success: true,
      data: {
        memberCount: memberCount || 0,
        todayViews: todayViews || 0,
        todayOrders: todayOrders || 0,
        activeVendors: activeVendors || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch stats',
        data: {
          memberCount: 0,
          todayViews: 0,
          todayOrders: 0,
          activeVendors: 0,
        },
      },
      { status: 500 }
    );
  }
}


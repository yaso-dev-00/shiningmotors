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
        data: [],
      }, { status: 401 });
    }

    // Get user's top categories
    const { data: interactions } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('metadata')
      .eq('user_id', userId)
      .eq('interaction_type', 'view')
      .eq('item_type', 'product');

    const categoryCounts: Record<string, number> = {};
    // @ts-ignore - user_interactions table not in types
    interactions?.forEach((item: any) => {
      const category = (item.metadata as any)?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    if (topCategories.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Fetch products on sale in user's categories
    const allDeals: any[] = [];
    for (const category of topCategories) {
      const result = await shopApi.products.getFiltered({
        category,
        sortBy: 'newest',
        page: 1,
        pageSize: 10,
      });
      if (result.data) {
        allDeals.push(...result.data);
      }
    }

    // Filter products with discounts
    const deals = allDeals
      .filter((p) => {
        const hasDiscount = p.discount_percentage > 0 || 
                           p.status === 'on_sale' || 
                           (p.original_price && p.price < p.original_price);
        return hasDiscount;
      })
      .sort((a, b) => {
        const discountA = a.discount_percentage || 0;
        const discountB = b.discount_percentage || 0;
        return discountB - discountA;
      })
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      data: deals,
    });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch deals',
        data: [],
      },
      { status: 500 }
    );
  }
}


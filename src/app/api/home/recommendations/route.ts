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

    // Get user's top 3 categories from interactions
    const { data: interactions, error: interactionsError } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('metadata')
      .eq('user_id', userId)
      .eq('interaction_type', 'view')
      .eq('item_type', 'product');

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
    }

    // Process category data
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

    // Get viewed product IDs to exclude
    const { data: viewedProducts } = await supabase
      // @ts-ignore - user_interactions table not in types
      .from('user_interactions')
      .select('item_id')
      .eq('user_id', userId)
      .eq('interaction_type', 'view')
      .eq('item_type', 'product');

    // @ts-ignore - user_interactions table not in types
    const viewedProductIds = viewedProducts?.map((p: any) => p.item_id).filter(Boolean) || [];

    // Fetch products in top categories
    const allProducts: any[] = [];
    for (const category of topCategories) {
      const result = await shopApi.products.getFiltered({
        category,
        sortBy: 'newest',
        page: 1,
        pageSize: 10,
      });
      if (result.data) {
        allProducts.push(...result.data);
      }
    }

    // Filter out viewed products and limit to 10
    const recommendations = allProducts
      .filter((p) => !viewedProductIds.includes(p.id))
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch recommendations',
        data: [],
      },
      { status: 500 }
    );
  }
}


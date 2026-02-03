import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

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

    const { data: wishlistItems, error } = await supabase
      .from('wishlist')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .eq('item_type', 'product')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching wishlist:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch wishlist',
        data: [],
      }, { status: 500 });
    }

    // Extract products from wishlist items
    const products = wishlistItems
      ?.map((item: any) => item.product)
      .filter(Boolean) || [];

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch wishlist',
        data: [],
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import type { Database } from '@/integrations/supabase/types';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WishlistInsert = Database['public']['Tables']['wishlist']['Insert'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, item_id, item_type } = body as WishlistInsert;

    if (!user_id || !item_id || !item_type) {
      return NextResponse.json(
        { error: 'user_id, item_id, and item_type are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if item already exists
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user_id)
      .eq('item_id', item_id)
      .eq('item_type', item_type)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Item already in wishlist' },
        { status: 409 }
      );
    }

    // Insert new item
    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id, item_id, item_type })
      .select()
      .single();

    if (error) {
      console.error('Error adding to wishlist:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST /api/wishlist:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to add item to wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType') as 'product' | 'vehicle' | null;

    if (!userId || !itemId || !itemType) {
      return NextResponse.json(
        { error: 'userId, itemId, and itemType are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType);

    if (error) {
      console.error('Error removing from wishlist:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/wishlist:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to remove item from wishlist' },
      { status: 500 }
    );
  }
}


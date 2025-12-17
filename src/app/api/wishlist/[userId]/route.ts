import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import type { Database } from '@/integrations/supabase/types';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WishlistItem = Database['public']['Tables']['wishlist']['Row'];

export interface WishlistItemWithDetails extends WishlistItem {
  product?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
}

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

    // Fetch wishlist items
    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (wishlistError) {
      console.error('Error fetching wishlist:', wishlistError);
      return NextResponse.json(
        { error: wishlistError.message },
        { status: 500 }
      );
    }

    if (!wishlistItems || wishlistItems.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Separate products and vehicles
    const productIds = wishlistItems
      .filter(item => item.item_type === 'product')
      .map(item => item.item_id);
    const vehicleIds = wishlistItems
      .filter(item => item.item_type === 'vehicle')
      .map(item => item.item_id);

    // Fetch product details
    let products: Record<string, unknown>[] = [];
    if (productIds.length > 0) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (productError) {
        console.error('Error fetching products:', productError);
      } else {
        products = productData || [];
      }
    }

    // Fetch vehicle details
    let vehicles: Record<string, unknown>[] = [];
    if (vehicleIds.length > 0) {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .in('id', vehicleIds);
      
      if (vehicleError) {
        console.error('Error fetching vehicles:', vehicleError);
      } else {
        vehicles = vehicleData || [];
      }
    }

    // Combine wishlist items with their details
    const itemsWithDetails: WishlistItemWithDetails[] = wishlistItems.map(item => {
      if (item.item_type === 'product') {
        const product = products.find(p => p.id === item.item_id);
        return { ...item, product };
      } else {
        const vehicle = vehicles.find(v => v.id === item.item_id);
        return { ...item, vehicle };
      }
    });

    return NextResponse.json({ data: itemsWithDetails });
  } catch (error: any) {
    console.error('Error in GET /api/wishlist/[userId]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}


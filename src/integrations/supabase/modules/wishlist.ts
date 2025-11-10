
import { supabase } from '../client';
import type { Database } from '../types';

type WishlistItem = Database['public']['Tables']['wishlist']['Row'];
type WishlistInsert = Database['public']['Tables']['wishlist']['Insert'];

export interface WishlistItemWithDetails extends WishlistItem {
  product?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
}

export const wishlistApi = {
  // Get all wishlist items for a user
  getByUserId: (userId: string) => 
    supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

  // Add item to wishlist
  addItem: (values: WishlistInsert) => 
    supabase.from('wishlist').insert(values),

  // Remove item from wishlist
  removeItem: (userId: string, itemId: string, itemType: 'product' | 'vehicle') => 
    supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType),

  // Check if item is in wishlist
  isInWishlist: async (userId: string, itemId: string, itemType: 'product' | 'vehicle') => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .single();
    
    return { exists: !!data && !error, error };
  },

  // Get wishlist items with product/vehicle details
  getWithDetails: async (userId: string) => {
    const { data: wishlistItems, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !wishlistItems) return { data: [], error };

    // Separate products and vehicles
    const productIds = wishlistItems.filter(item => item.item_type === 'product').map(item => item.item_id);
    const vehicleIds = wishlistItems.filter(item => item.item_type === 'vehicle').map(item => item.item_id);

    // Fetch product details
    let products: Record<string, unknown>[] = [];
    if (productIds.length > 0) {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      products = productData || [];
    }

    // Fetch vehicle details
    let vehicles: Record<string, unknown>[] = [];
    if (vehicleIds.length > 0) {
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*')
        .in('id', vehicleIds);
      vehicles = vehicleData || [];
    }

    // Combine wishlist items with their details
    const itemsWithDetails = wishlistItems.map(item => {
      if (item.item_type === 'product') {
        const product = products.find(p => p.id === item.item_id);
        return { ...item, product };
      } else {
        const vehicle = vehicles.find(v => v.id === item.item_id);
        return { ...item, vehicle };
      }
    });

    return { data: itemsWithDetails, error: null };
  }
};

export { type WishlistItem, type WishlistInsert };

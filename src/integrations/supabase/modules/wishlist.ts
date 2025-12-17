"use client";
import type { Database } from '../types';

type WishlistItem = Database['public']['Tables']['wishlist']['Row'];
type WishlistInsert = Database['public']['Tables']['wishlist']['Insert'];

export interface WishlistItemWithDetails extends WishlistItem {
  product?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
}

// Helper function to make API calls with cache-busting
const apiCall = async (url: string, options?: RequestInit) => {
  // Add cache-busting timestamp to ensure fresh data
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  const urlWithCacheBust = `${url}${separator}_t=${timestamp}`;
  
  const response = await fetch(urlWithCacheBust, {
    ...options,
    cache: 'no-store', // Force no caching
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return { data: null, error: error.error || `HTTP ${response.status}` };
  }

  const data = await response.json();
  return { data, error: null };
};

export const wishlistApi = {
  // Get all wishlist items for a user
  getByUserId: async (userId: string) => {
    const response = await apiCall(`/api/wishlist/${userId}`);
    if (response.error) {
      return { data: null, error: response.error };
    }
    return { data: response.data?.data || [], error: null };
  },

  // Add item to wishlist
  addItem: async (values: WishlistInsert) => {
    const response = await apiCall('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    if (response.error) {
      return { data: null, error: response.error };
    }
    return { data: response.data?.data || null, error: null };
  },

  // Remove item from wishlist
  removeItem: async (userId: string, itemId: string, itemType: 'product' | 'vehicle') => {
    const params = new URLSearchParams({
      userId,
      itemId,
      itemType,
    });
    const response = await apiCall(`/api/wishlist?${params.toString()}`, {
      method: 'DELETE',
    });
    if (response.error) {
      return { error: response.error };
    }
    return { error: null };
  },

  // Check if item is in wishlist
  isInWishlist: async (userId: string, itemId: string, itemType: 'product' | 'vehicle') => {
    const response = await apiCall(`/api/wishlist/${userId}`);
    if (response.error) {
      return { exists: false, error: response.error };
    }
    const items = response.data?.data || [];
    const exists = items.some(
      (item: WishlistItemWithDetails) =>
        String(item.item_id) === String(itemId) && item.item_type === itemType
    );
    return { exists, error: null };
  },

  // Get wishlist items with product/vehicle details
  getWithDetails: async (userId: string) => {
    const response = await apiCall(`/api/wishlist/${userId}`);
    if (response.error) {
      return { data: [], error: response.error };
    }
    return { data: response.data?.data || [], error: null };
  }
};

export { type WishlistItem, type WishlistInsert };

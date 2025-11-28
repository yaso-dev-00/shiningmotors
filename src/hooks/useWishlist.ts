 "use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  wishlistApi,
  type WishlistItemWithDetails,
} from "@/integrations/supabase/modules/wishlist";
import { useToast } from "@/hooks/use-toast";

// Module-level cache and listener registry to avoid duplicate fetches across many hook instances
let wishlistCache: WishlistItemWithDetails[] = [];
let cacheForUserId: string | null = null;
let isFetchingWishlist = false;
const wishlistListeners = new Set<(items: WishlistItemWithDetails[]) => void>();

const notifyWishlistListeners = (items: WishlistItemWithDetails[]) => {
  wishlistListeners.forEach((notify) => {
    try {
      notify(items);
    } catch {
      /* no-op */
    }
  });
};

export const useWishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(false);
  const pathname = usePathname();

  const fetchWishlist = async () => {
    if (!user) return;
    // If we already have cache for this user, serve it immediately
    if (cacheForUserId === user.id && wishlistCache.length > 0) {
      setWishlistItems(wishlistCache);
    }

    // Prevent parallel duplicate requests
    if (isFetchingWishlist) return;

    setLoading(true);
    isFetchingWishlist = true;
    try {
      const { data, error } = await wishlistApi.getWithDetails(user.id);
      if (error) throw error;
      const items = data || [];
      // Update cache and notify all listeners
      wishlistCache = items;
      cacheForUserId = user.id;
      setWishlistItems(items);
      notifyWishlistListeners(items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isFetchingWishlist = false;
    }
  };

  const addToWishlist = async (
    itemId: string,
    itemType: "product" | "vehicle"
  ) => {
    if (loading) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await wishlistApi.addItem({
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
      });

      if (error) throw error;

      toast({
        title: "Added to Wishlist",
        description: "Item has been added to your wishlist",
      });

      await fetchWishlist(); // Refresh the wishlist
      return true;
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to wishlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromWishlist = async (
    itemId: string,
    itemType: "product" | "vehicle"
  ) => {
    if (!user) return false;
    if (loading) return;
    try {
      const { error } = await wishlistApi.removeItem(user.id, itemId, itemType);
      if (error) throw error;

      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
      });

      await fetchWishlist(); // Refresh the wishlist
      return true;
    } catch (error: any) {
      console.error("Error removing from wishlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const isInWishlist = (itemId: string, itemType: "product" | "vehicle") => {
    return wishlistItems.some(
      (item) => item.item_id === itemId && item.item_type === itemType
    );
  };

  useEffect(() => {
    mountedRef.current = true;
    // Register listener so all instances get cache updates
    wishlistListeners.add(setWishlistItems);

    return () => {
      mountedRef.current = false;
      wishlistListeners.delete(setWishlistItems);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // If we have cached data for this user, use it immediately
      if (cacheForUserId === user.id) {
        setWishlistItems(wishlistCache);
        // If cache is empty and we haven't fetched yet, fetch it
        if (wishlistCache.length === 0 && !isFetchingWishlist) {
          fetchWishlist();
        }
      } else {
        // No cache for this user, fetch it
        fetchWishlist();
      }
    } else {
      setWishlistItems([]);
      // Clear cache when user logs out
      wishlistCache = [];
      cacheForUserId = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
};

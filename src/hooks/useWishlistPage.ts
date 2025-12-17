"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  wishlistApi,
  type WishlistItemWithDetails,
} from "@/integrations/supabase/modules/wishlist";
import { useToast } from "@/hooks/use-toast";

// Global event system to notify wishlist page of changes
const wishlistPageListeners = new Set<() => void>();

export const notifyWishlistPageUpdate = () => {
  wishlistPageListeners.forEach((notify) => {
    try {
      notify();
    } catch {
      /* no-op */
    }
  });
};

/**
 * Separate hook for the Wishlist page that always fetches fresh data
 * This doesn't interfere with optimistic updates used by WishlistButton components
 */
export const useWishlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const isWishlistPage = pathname === '/wishlist';
  // Track fetch requests to ignore stale responses
  const fetchVersionRef = useRef(0);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    const requestId = ++fetchVersionRef.current;
    setLoading(true);
    try {
      const { data, error } = await wishlistApi.getWithDetails(user.id);
      if (error) throw error;
      const items = data || [];
      // Only apply if this is the latest request
      if (requestId === fetchVersionRef.current) {
        setWishlistItems(() => [...items]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      });
    } finally {
      if (requestId === fetchVersionRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, toast]);

  const removeFromWishlist = useCallback(async (
    itemId: string,
    itemType: "product" | "vehicle"
  ) => {
    if (!user) return false;

    // Store previous items for potential rollback
    let previousItems: WishlistItemWithDetails[] = [];

    // Optimistic update: remove item from UI immediately
    setWishlistItems((currentItems) => {
      previousItems = [...currentItems];
      const filtered = currentItems.filter(
        (item) => !(String(item.item_id) === String(itemId) && item.item_type === itemType)
      );
      // Force new array reference to ensure React detects the change
      return filtered.length !== currentItems.length ? [...filtered] : currentItems;
    });

    try {
      const { error } = await wishlistApi.removeItem(user.id, itemId, itemType);
      if (error) throw error;

      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
      });

      // Immediately refetch to get updated data from server and ensure UI is in sync
      await fetchWishlist();
      
      return true;
    } catch (error: any) {
      console.error("Error removing from wishlist:", error);
      // Revert optimistic update on error
      setWishlistItems(() => [...previousItems]);
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchWishlist]);

  // Always fetch fresh data when navigating to wishlist page
  useEffect(() => {
    if (isWishlistPage && user) {
      // Always fetch fresh data when route changes to wishlist page
      fetchWishlist();
    }
  }, [isWishlistPage, user?.id, fetchWishlist]);

  // Listen for wishlist updates from other pages
  useEffect(() => {
    const handleUpdate = () => {
      if (user) {
        fetchWishlist();
      }
    };

    wishlistPageListeners.add(handleUpdate);

    return () => {
      wishlistPageListeners.delete(handleUpdate);
    };
  }, [user, fetchWishlist]);

  // Refetch when page becomes visible (user navigates back to tab/window)
  useEffect(() => {
    if (!isWishlistPage) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchWishlist();
      }
    };

    const handleFocus = () => {
      if (user) {
        fetchWishlist();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isWishlistPage, user, fetchWishlist]);

  return {
    wishlistItems,
    loading,
    removeFromWishlist,
    refetch: fetchWishlist,
  };
};


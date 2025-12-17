"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  wishlistApi,
  type WishlistItemWithDetails,
} from "@/integrations/supabase/modules/wishlist";
import { useToast } from "@/hooks/use-toast";
import { notifyWishlistPageUpdate } from "./useWishlistPage";

// Listener registry so multiple hook instances stay in sync
let isFetchingWishlist = false;
let lastFetchTime = 0;
let lastFetchTimestamp = 0; // Track when data was last fetched
const wishlistListeners = new Set<(items: WishlistItemWithDetails[], timestamp: number) => void>();

const notifyWishlistListeners = (items: WishlistItemWithDetails[], timestamp: number) => {
  wishlistListeners.forEach((notify) => {
    try {
      notify(items, timestamp);
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
  const lastDataTimestampRef = useRef<number>(0); // Track the timestamp of data we have

  const fetchWishlist = useCallback(async (force = false) => {
    if (!user) {
      setWishlistItems([]);
      const timestamp = Date.now();
      lastDataTimestampRef.current = timestamp;
      notifyWishlistListeners([], timestamp);
      return;
    }

    // If forced, always fetch (bypass all checks)
    // Otherwise, prevent parallel duplicate requests
    if (!force) {
      if (isFetchingWishlist) {
        return;
      }
      // Check if we recently fetched (within 100ms) to avoid rapid refetches
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      if (timeSinceLastFetch < 100) {
        return;
      }
    }

    // If forced and there's already a fetch in progress, wait a bit then proceed
    // This ensures we get fresh data even if another instance is fetching
    if (force && isFetchingWishlist) {
      // Wait a short time for the in-flight fetch to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      // Check again - if still fetching, proceed anyway (we want fresh data)
    }

    setLoading(true);
    isFetchingWishlist = true;
    const fetchTimestamp = Date.now(); // Unique timestamp for this fetch
    try {
      const { data, error } = await wishlistApi.getWithDetails(user.id);
      if (error) throw error;
      const items = data || [];
      
      // Always update with fresh data from API (it's the source of truth)
      // The timestamp check prevents older fetches from overwriting newer ones
      if (fetchTimestamp >= lastDataTimestampRef.current) {
        setWishlistItems(items);
        lastDataTimestampRef.current = fetchTimestamp;
      }
      
      // Notify listeners with timestamp so they can decide if data is stale
      notifyWishlistListeners(items, fetchTimestamp);
      lastFetchTime = Date.now();
      lastFetchTimestamp = fetchTimestamp;
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
  }, [user?.id, toast]);

  const addToWishlist = async (
    itemId: string,
    itemType: "product" | "vehicle"
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return false;
    }
   
    // Optimistic update: add item to local state immediately
    let updatedItems: WishlistItemWithDetails[] | null = null;
    setWishlistItems((currentItems) => {
      // Check if already in wishlist using current state
      const alreadyInWishlist = currentItems.some(
        (item) => String(item.item_id) === String(itemId) && item.item_type === itemType
      );
      if (alreadyInWishlist) {
        return currentItems; // Already exists, no change needed
      }

      const optimisticItem: WishlistItemWithDetails = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        created_at: new Date().toISOString(),
      };
      updatedItems = [...currentItems, optimisticItem];
      return updatedItems;
    });
    
    // Notify listeners after state update (use current timestamp)
    if (updatedItems) {
      const timestamp = Date.now();
      lastDataTimestampRef.current = timestamp;
      notifyWishlistListeners(updatedItems, timestamp);
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

      // Notify wishlist page to refetch
      notifyWishlistPageUpdate();

      // Don't refetch immediately - keep optimistic update for instant UI feedback
      // The data will sync on next natural fetch (route change, etc.)
      return true;
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      // Revert optimistic update on error
      setWishlistItems((currentItems) => {
        const revertedItems = currentItems.filter(
          (item) => !(String(item.item_id) === String(itemId) && item.item_type === itemType && item.id?.startsWith('temp-'))
        );
        const timestamp = Date.now();
        lastDataTimestampRef.current = timestamp;
        notifyWishlistListeners(revertedItems, timestamp);
        return revertedItems;
      });
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
    
    // Optimistic update: remove item from local state immediately
    let updatedItems: WishlistItemWithDetails[] | null = null;
    setWishlistItems((currentItems) => {
      updatedItems = currentItems.filter(
        (item) => !(String(item.item_id) === String(itemId) && item.item_type === itemType)
      );
      
      // If no change, return early
      if (updatedItems.length === currentItems.length) {
        updatedItems = null;
        return currentItems;
      }
      
      return updatedItems;
    });
    
    // Notify listeners after state update (use current timestamp)
    if (updatedItems) {
      const timestamp = Date.now();
      lastDataTimestampRef.current = timestamp;
      notifyWishlistListeners(updatedItems, timestamp);
    }

    try {
      const { error } = await wishlistApi.removeItem(user.id, itemId, itemType);
      if (error) throw error;

      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
      });

      // Notify wishlist page to refetch
      notifyWishlistPageUpdate();

      // Refetch to ensure server truth and keep UI in sync
      await fetchWishlist(true);
      return true;
    } catch (error: any) {
      console.error("Error removing from wishlist:", error);
      // Revert optimistic update on error - refetch to get correct state
      await fetchWishlist();
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist",
        variant: "destructive",
      });
      return false;
    }
  };

  // Use useCallback to ensure the function reference is stable but always uses latest state
  const isInWishlist = useCallback((itemId: string, itemType: "product" | "vehicle") => {
    return wishlistItems.some(
      (item) => String(item.item_id) === String(itemId) && item.item_type === itemType
    );
  }, [wishlistItems]);

  const isInitialMountRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // Register listener so all instances get cache updates
    // Use a wrapper function to ensure we always use the latest setWishlistItems
    // Only update if the incoming data is newer than what we have
    const updateListener = (items: WishlistItemWithDetails[], timestamp: number) => {
      if (mountedRef.current) {
        // On initial mount, ignore listener updates until we've done our own fetch
        // This prevents stale data from other instances overwriting fresh data
        if (isInitialMountRef.current) {
          return; // Ignore listener updates during initial mount
        }
        // Only update if the incoming data is newer than what we have
        if (timestamp >= lastDataTimestampRef.current) {
          setWishlistItems(items);
          lastDataTimestampRef.current = timestamp;
        }
      }
    };
    wishlistListeners.add(updateListener);

    return () => {
      mountedRef.current = false;
      wishlistListeners.delete(updateListener);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Always fetch fresh data for the current user (force on mount/user change)
      fetchWishlist(true).then(() => {
        // Mark initial mount as complete after first fetch
        isInitialMountRef.current = false;
      });
    } else {
      setWishlistItems([]);
      const timestamp = Date.now();
      lastDataTimestampRef.current = timestamp;
      notifyWishlistListeners([], timestamp);
      isInitialMountRef.current = false;
    }
  }, [user?.id, fetchWishlist]);

  // Always fetch fresh data when navigating to wishlist page
  useEffect(() => {
    if (pathname === '/wishlist' && user) {
      // Force fresh fetch when navigating to wishlist page
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      // Only fetch if it's been more than 100ms since last fetch (avoid rapid refetches)
      if (timeSinceLastFetch > 100) {
        fetchWishlist(true);
      }
    }
  }, [pathname, user?.id, fetchWishlist]);

  // Refetch when page becomes visible or gains focus (user returns to tab/window)
  useEffect(() => {
    if (!user) return;

    const onVisibility = () => {
      if (!document.hidden && pathname === '/wishlist') {
        // Force fresh fetch when page becomes visible
        fetchWishlist(true);
      }
    };
    const onFocus = () => {
      if (pathname === '/wishlist') {
        // Force fresh fetch when window gains focus
        fetchWishlist(true);
      }
    };
    
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname, user?.id, fetchWishlist]);

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
};

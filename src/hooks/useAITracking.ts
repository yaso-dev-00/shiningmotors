"use client";
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAI } from "@/contexts/AIContext";

/**
 * Hook to track user interactions for AI learning
 */
export const useAITracking = () => {
  const { user, session } = useAuth();
  const { pageContext } = useAI();

  const trackInteraction = useCallback(
    async (
      interactionType: "view" | "click" | "add_to_cart" | "purchase" | "search",
      itemType: "product" | "service" | "event" | "vendor" | "post",
      itemId?: string,
      metadata?: Record<string, any>
    ) => {
      if (!user?.id || !session?.access_token) return;

      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        };

        await fetch("/api/ai/track", {
          method: "POST",
          headers,
          body: JSON.stringify({
            interaction_type: interactionType,
            item_type: itemType,
            item_id: itemId,
            metadata: {
              ...metadata,
              page: pageContext.pathname,
              pageType: pageContext.pageType,
            },
          }),
        });
      } catch (error) {
        console.warn("Failed to track interaction:", error);
      }
    },
    [user?.id, session?.access_token, pageContext]
  );

  return { trackInteraction };
};




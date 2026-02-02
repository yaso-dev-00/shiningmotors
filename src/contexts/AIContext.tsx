"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";

interface PageContext {
  pathname: string;
  pageType: "shop" | "services" | "events" | "vehicles" | "vendor-map" | "social" | "sim-racing" | "other";
  pageData?: any;
}

interface UserContext {
  cartItems: any[];
  orders: any[];
  hasBookings: boolean;
  location?: string;
  preferences?: any;
}

interface AIContextType {
  pageContext: PageContext;
  userContext: UserContext;
  conversationHistory: Array<{ role: string; content: string }>;
  addMessage: (role: "user" | "assistant", content: string) => void;
  clearHistory: () => void;
  getContextForAI: () => {
    page: PageContext;
    user: UserContext;
    conversation: Array<{ role: string; content: string }>;
  };
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider = ({ children }: AIProviderProps) => {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  
  // Safely access cart context (may not be available during SSR)
  let cartItems: any[] = [];
  let orders: any[] = [];
  try {
    const cartContext = useCart();
    cartItems = cartContext.cartItems || [];
    orders = cartContext.orders || [];
  } catch {
    // Cart context not available (SSR or not wrapped)
    cartItems = [];
    orders = [];
  }
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);

  // Determine page type from pathname
  const getPageType = (path: string): PageContext["pageType"] => {
    if (path.startsWith("/shop")) return "shop";
    if (path.startsWith("/services")) return "services";
    if (path.startsWith("/events")) return "events";
    if (path.startsWith("/vehicles")) return "vehicles";
    if (path.startsWith("/vendors/map")) return "vendor-map";
    if (path.startsWith("/social")) return "social";
    if (path.startsWith("/sim-racing")) return "sim-racing";
    return "other";
  };

  const pageContext: PageContext = {
    pathname,
    pageType: getPageType(pathname),
  };

  const userContext: UserContext = {
    cartItems: cartItems || [],
    orders: orders || [],
    hasBookings: false, // TODO: Get from service bookings context
    location: profile?.location || undefined,
    preferences: profile ? {
      role: profile.role,
      isVendor: profile.is_vendor,
      interests: profile.tag || [],
    } : undefined,
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const message = { role, content };
    setConversationHistory((prev) => {
      const updated = [...prev, message].slice(-10); // Keep last 10 messages
      historyRef.current = updated;
      return updated;
    });
  };

  const clearHistory = () => {
    setConversationHistory([]);
    historyRef.current = [];
  };

  const getContextForAI = () => {
    return {
      page: pageContext,
      user: userContext,
      conversation: historyRef.current,
    };
  };

  // Load conversation history from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`ai_conversation_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setConversationHistory(parsed);
          historyRef.current = parsed;
        }
      } catch (error) {
        console.warn("Failed to load conversation history:", error);
      }
    }
  }, [user?.id]);

  // Save conversation history to localStorage
  useEffect(() => {
    if (user?.id && conversationHistory.length > 0) {
      try {
        localStorage.setItem(
          `ai_conversation_${user.id}`,
          JSON.stringify(conversationHistory)
        );
      } catch (error) {
        console.warn("Failed to save conversation history:", error);
      }
    }
  }, [conversationHistory, user?.id]);

  const value: AIContextType = {
    pageContext,
    userContext,
    conversationHistory,
    addMessage,
    clearHistory,
    getContextForAI,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};


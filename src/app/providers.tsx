"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import GlobalProvider from "@/contexts/GlobalContext";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import React from "react";

// Create a singleton QueryClient that's always available
// This ensures QueryClient exists even during SSR/build
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          staleTime: 60 * 1000, // 1 minute
        },
      },
    });
  }
  // Browser: use singleton pattern to keep the same query client
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          staleTime: 60 * 1000, // 1 minute
        },
      },
    });
  }
  return browserQueryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Always get a QueryClient, even during SSR
  const [queryClient] = React.useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <GlobalProvider>
                {children}
                <Toaster />
                <Sonner />
              </GlobalProvider>
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}




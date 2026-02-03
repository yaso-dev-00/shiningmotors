"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Eye, ShoppingCart, Calendar, Package } from "lucide-react";

export default function ActivitySummaryCard() {
  const { user } = useSafeAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["activity-summary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch("/api/home/user-interactions", {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data?.activitySummary || null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (!user?.id || isLoading || !data) {
    return null;
  }

  const { viewsThisWeek, cartItems, upcomingEvents, recentOrders } = data;

  // Only show if at least one stat > 0
  if (viewsThisWeek === 0 && cartItems === 0 && upcomingEvents === 0 && recentOrders === 0) {
    return null;
  }

  const stats = [
    { label: "Views This Week", value: viewsThisWeek, icon: Eye, link: "/shop" },
    { label: "Items in Cart", value: cartItems, icon: ShoppingCart, link: "/shop/cart" },
    { label: "Upcoming Events", value: upcomingEvents, icon: Calendar, link: "/events" },
    { label: "Recent Orders", value: recentOrders, icon: Package, link: "/shop/orders" },
  ];

  return (
    <section className="py-6">
      <div className="mx-auto px-4 sm:px-8">
        <Card className="bg-gradient-to-br from-white to-gray-50 border-2">
          <CardHeader>
            <CardTitle className="text-xl">Your Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    onClick={() => router.push(stat.link as any)}
                    className="flex flex-col items-center p-4 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                  >
                    <Icon className="h-6 w-6 text-sm-red mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600 text-center mt-1">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


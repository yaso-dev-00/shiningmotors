"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Eye, ShoppingBag, Store } from "lucide-react";

export default function SocialProofSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["social-proof-stats"],
    queryFn: async () => {
      const response = await fetch("/api/home/stats");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return null;
  }

  const { memberCount = 0, todayViews = 0, todayOrders = 0, activeVendors = 0 } = data || {};

  const stats = [
    { icon: Users, label: "automotive enthusiasts", value: memberCount },
    { icon: Eye, label: "products viewed today", value: todayViews },
    { icon: ShoppingBag, label: "orders today", value: todayOrders },
    { icon: Store, label: "verified vendors", value: activeVendors },
  ];

  return (
    <section className="py-6">
      <div className="mx-auto px-4 sm:px-8">
        <Card className="bg-gradient-to-br from-sm-red/5 to-sm-red/10 border-2 border-sm-red/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      <Icon className="h-8 w-8 text-sm-red" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">
                      {stat.value.toLocaleString()}+
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 mt-1">{stat.label}</div>
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


"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Calendar, Package } from "lucide-react";
import NextLink from "next/link";

export default function ValuePropositionCards() {
  const { user } = useSafeAuth();

  // Only show for unauthenticated users
  if (user) {
    return null;
  }

  const { data: statsData } = useQuery({
    queryKey: ["value-props-stats"],
    queryFn: async () => {
      const response = await fetch("/api/home/stats");
      if (!response.ok) return {};
      const result = await response.json();
      return result.data || {};
    },
    staleTime: 10 * 60 * 1000,
  });

  const cards = [
    {
      icon: Sparkles,
      title: "Personalized Recommendations",
      description: `For ${statsData?.memberCount || 0} members`,
      color: "from-purple-500/10 to-purple-600/5",
      borderColor: "border-purple-300",
    },
    {
      icon: Heart,
      title: "Save Your Favorites",
      description: "Never lose track of items you love",
      color: "from-pink-500/10 to-pink-600/5",
      borderColor: "border-pink-300",
    },
    {
      icon: Calendar,
      title: "Join Events & Competitions",
      description: "Connect with the community",
      color: "from-blue-500/10 to-blue-600/5",
      borderColor: "border-blue-300",
    },
    {
      icon: Package,
      title: "Track Your Orders",
      description: "Stay updated on your purchases",
      color: "from-green-500/10 to-green-600/5",
      borderColor: "border-green-300",
    },
  ];

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className={`bg-gradient-to-br ${card.color} border-2 ${card.borderColor} hover:shadow-lg transition-shadow`}
              >
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <Icon className="h-8 w-8 text-gray-700" />
                  </div>
                  <CardTitle className="text-center text-lg">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <NextLink href="/auth">Sign Up</NextLink>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


"use client";

import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "@/views/Index";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ShoppingBag, Calendar, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function LiveActivityFeedSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["live-activity"],
    queryFn: async () => {
      const response = await fetch("/api/home/activity");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || { recentPurchases: [], newEvents: [], popularPosts: [] };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return null;
  }

  const { recentPurchases = [], newEvents = [], popularPosts = [] } = data || {};

  if (recentPurchases.length === 0 && newEvents.length === 0 && popularPosts.length === 0) {
    return null;
  }

  const activities: Array<{
    type: "purchase" | "event" | "post";
    icon: any;
    text: string;
    time: string;
  }> = [];

  recentPurchases.slice(0, 3).forEach((purchase: any) => {
    const userName = purchase.profiles?.full_name || purchase.profiles?.username || "Someone";
    const productName = purchase.order_items?.[0]?.product?.name || "a product";
    activities.push({
      type: "purchase",
      icon: ShoppingBag,
      text: `${userName} just bought ${productName}`,
      time: formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true }),
    });
  });

  newEvents.slice(0, 2).forEach((event: any) => {
    activities.push({
      type: "event",
      icon: Calendar,
      text: `New event: ${event.title}`,
      time: formatDistanceToNow(new Date(event.created_at), { addSuffix: true }),
    });
  });

  popularPosts.slice(0, 2).forEach((post: any) => {
    const userName = post.profile?.full_name || post.profile?.username || "Someone";
    activities.push({
      type: "post",
      icon: Heart,
      text: `${userName} shared a new post`,
      time: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
    });
  });

  if (activities.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto px-4 sm:px-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Trending Now</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="p-2 bg-sm-red/10 rounded-full">
                    <Icon className="h-4 w-4 text-sm-red" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


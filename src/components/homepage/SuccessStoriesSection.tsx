"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export default function SuccessStoriesSection() {
  const { user } = useSafeAuth();

  // Only show for unauthenticated users
  if (user) {
    return null;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => {
      // Get top members with orders
      const response = await fetch("/api/home/stats");
      if (!response.ok) return { members: [], memberCount: 0 };
      const result = await response.json();
      const memberCount = result.data?.memberCount || 0;

      // For now, return placeholder data
      // In the future, fetch actual member testimonials from database
      return {
        members: [],
        memberCount,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return null;
  }

  const { memberCount = 0 } = data || {};

  // If we have member count, show a simple success message
  if (memberCount > 0) {
    return (
      <section className="py-6">
        <div className="mx-auto px-4 sm:px-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Join {memberCount.toLocaleString()} satisfied members</h2>
              <p className="text-gray-600 mb-4">
                Be part of a thriving automotive community
              </p>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return null;
}


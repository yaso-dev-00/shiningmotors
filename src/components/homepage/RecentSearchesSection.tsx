"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { useRouter } from "next/navigation";
import { SectionHeading } from "@/views/Index";
import { Badge } from "@/components/ui/badge";
import HorizontalScrollHomePage from "./HorizontalScroll";

export default function RecentSearchesSection() {
  const { user } = useSafeAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["recent-searches", user?.id],
    queryFn: async () => {
      if (!user?.id) return { recentSearches: [] };
      const response = await fetch("/api/home/user-interactions", {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || { recentSearches: [] };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (!user?.id || isLoading) {
    return null;
  }

  const searches = data?.recentSearches || [];

  if (searches.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto">
        <SectionHeading title="Recent Searches" linkText="Clear" to="/search" />
        <HorizontalScrollHomePage>
          {searches.slice(0, 8).map((query: string, index: number) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-sm-red hover:text-white px-4 py-2 text-sm"
              onClick={() => router.push(`/shop?search=${encodeURIComponent(query)}`)}
            >
              {query}
            </Badge>
          ))}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


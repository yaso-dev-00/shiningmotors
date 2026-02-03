"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { motion } from "framer-motion";
import { ProductCardWrapper } from "@/components/shop/ProductCardWrapper";
import { Badge } from "@/components/ui/badge";

export default function RecentlyViewedSection() {
  const { user } = useSafeAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["recently-viewed", user?.id],
    queryFn: async () => {
      if (!user?.id) return { recentViews: [] };
      const response = await fetch("/api/home/user-interactions", {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || { recentViews: [] };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (!user?.id || isLoading) {
    return null;
  }

  const recentViews = data?.recentViews || [];

  if (recentViews.length === 0) {
    return null; // Hide if no data
  }

  return (
    <section className="py-6">
      <div className="mx-auto">
        <SectionHeading title="Recently Viewed" linkText="View All" to="/shop" />
        <HorizontalScrollHomePage>
          {recentViews.slice(0, 10).map((product: any, index: number) => (
            <motion.div
              key={product.id || index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden relative"
            >
              <Badge className="absolute top-2 left-2 z-10 bg-sm-red text-white">
                Recently Viewed
              </Badge>
              <ProductCardWrapper product={product} />
            </motion.div>
          ))}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


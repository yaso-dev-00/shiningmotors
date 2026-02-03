"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { motion } from "framer-motion";
import { ProductCardWrapper } from "@/components/shop/ProductCardWrapper";
import { Badge } from "@/components/ui/badge";

export default function PersonalizedDealsSection() {
  const { user } = useSafeAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["personalized-deals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch("/api/home/deals", {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  if (!user?.id || isLoading) {
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto">
        <SectionHeading title="Deals Just For You" linkText="View All Deals" to="/shop" />
        <HorizontalScrollHomePage>
          {data.slice(0, 8).map((product: any, index: number) => (
            <motion.div
              key={product.id || index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden relative"
            >
              {product.discount_percentage > 0 && (
                <Badge className="absolute top-2 right-2 z-10 bg-green-500 text-white">
                  {product.discount_percentage}% OFF
                </Badge>
              )}
              <ProductCardWrapper product={product} />
            </motion.div>
          ))}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


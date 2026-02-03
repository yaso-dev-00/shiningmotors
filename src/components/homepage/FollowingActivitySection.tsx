"use client";

import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { motion } from "framer-motion";
import PostCardWrapper from "@/components/social/PostCardWrapper";

export default function FollowingActivitySection() {
  const { user } = useSafeAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["following-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch("/api/home/following-activity", {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  if (!user?.id || isLoading) {
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="mx-auto">
        <SectionHeading title="From People You Follow" linkText="View All" to="/social" />
        <HorizontalScrollHomePage>
          {data.slice(0, 6).map((post: any, index: number) => (
            <motion.div
              key={post.id || index}
              className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
            >
              <PostCardWrapper post={post} />
            </motion.div>
          ))}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


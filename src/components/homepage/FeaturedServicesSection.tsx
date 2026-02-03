"use client";

import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { motion } from "framer-motion";
import ServiceCard from "@/components/services/ServiceCard";
import { parseServiceContent } from "@/components/services/ServicePostsCarousel";

export default function FeaturedServicesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-services"],
    queryFn: async () => {
      const response = await fetch("/api/home/services");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="mx-auto">
          <SectionHeading title="Featured Services" linkText="View All" to="/services" />
          <HorizontalScrollHomePage>
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 h-48 bg-gray-200 rounded-xl"
                />
              ))}
          </HorizontalScrollHomePage>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null; // Hide if no data
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto">
        <SectionHeading title="Featured Services" linkText="View All" to="/services" />
        <HorizontalScrollHomePage>
          {data.slice(0, 8).map((service: any, index: number) => {
            const serviceData = parseServiceContent(service);
            return (
              <motion.div
                key={service.id || index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
              >
                <ServiceCard {...serviceData} category={service.category} />
              </motion.div>
            );
          })}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


"use client";

import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VendorSpotlightSection() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["featured-vendors"],
    queryFn: async () => {
      const response = await fetch("/api/home/vendors");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="mx-auto">
        <SectionHeading title="Vendor Spotlight" linkText="Find Vendors" to="/vendors/map" />
        <HorizontalScrollHomePage>
          {data.slice(0, 4).map((vendor: any, index: number) => (
            <motion.div
              key={vendor.id || index}
              whileHover={{ scale: 1.02 }}
              className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={vendor.avatar_url || ""} />
                      <AvatarFallback>
                        {vendor.full_name?.[0] || vendor.username?.[0] || "V"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h3 className="font-semibold text-lg">{vendor.full_name || vendor.username}</h3>
                  {vendor.rating && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{vendor.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {vendor.is_verified && (
                    <Badge className="mt-2 bg-green-500">Verified</Badge>
                  )}
                </CardHeader>
                <CardContent className="text-center">
                  {vendor.location && (
                    <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{vendor.location}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/profile/${vendor.id}`)}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


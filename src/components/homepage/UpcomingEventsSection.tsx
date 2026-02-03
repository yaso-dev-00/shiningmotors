"use client";

import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "@/views/Index";
import HorizontalScrollHomePage from "./HorizontalScroll";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { useSafeAuth } from "@/hooks/use-safe-auth";

export default function UpcomingEventsSection() {
  const router = useRouter();
  const { user } = useSafeAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const response = await fetch("/api/home/events");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-6 bg-gray-50">
        <div className="mx-auto">
          <SectionHeading title="Upcoming Events" linkText="View All" to="/events" />
          <HorizontalScrollHomePage>
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 h-64 bg-gray-200 rounded-xl"
                />
              ))}
          </HorizontalScrollHomePage>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="mx-auto">
        <SectionHeading title="Upcoming Events" linkText="View All" to="/events" />
        <HorizontalScrollHomePage>
          {data.slice(0, 5).map((event: any, index: number) => {
            const startDate = new Date(event.start_date);
            const countdown = event.countdown || { days: 0, hours: 0, minutes: 0 };

            return (
              <motion.div
                key={event.id || index}
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Card className="h-full overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(startDate, "MMM dd, yyyy")}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {countdown.total > 0 && (
                      <div className="flex items-center text-sm text-sm-red font-semibold">
                        <Clock className="h-4 w-4 mr-2" />
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m
                      </div>
                    )}
                    <Button
                      className="w-full mt-4 bg-sm-red hover:bg-sm-red-light"
                      onClick={() => router.push(`/events/${event.id}`)}
                      disabled={!user}
                    >
                      {user ? "Register Now" : "Sign In to Register"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </HorizontalScrollHomePage>
      </div>
    </section>
  );
}


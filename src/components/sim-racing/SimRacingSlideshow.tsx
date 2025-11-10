
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trophy, Calendar, Settings, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";
import { cn } from "@/lib/utils";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  link: string;
  icon: React.ReactNode;
  color: string;
}

const SimRacingSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch data for the slideshow
  const { data: leagues, isLoading: isLeaguesLoading } = useQuery({
    queryKey: ["simSlideLeagues"],
    queryFn: async () => {
      const { data, error } = await simAppApi.leagues.getActiveLeagues();
      if (error) {
        console.error("Error fetching sim leagues for slideshow:", error);
        return [];
      }
      return data || [];
    }
  });

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ["simSlideEvents"],
    queryFn: async () => {
      const { data, error } = await simAppApi.events.getUpcomingEvents(2);
      if (error) {
        console.error("Error fetching sim events for slideshow:", error);
        return [];
      }
      return data || [];
    }
  });

  const { data: garages, isLoading: isGaragesLoading } = useQuery({
    queryKey: ["simSlideGarages"],
    queryFn: async () => {
      const { data, error } = await simAppApi.garages.getAllGarages();
      if (error) {
        console.error("Error fetching sim garages for slideshow:", error);
        return [];
      }
      return data || [];
    }
  });

  // Prepare slides when data is loaded
  useEffect(() => {
    if (isLeaguesLoading || isEventsLoading || isGaragesLoading) return;

    const newSlides: Slide[] = [
      // Default slide in case we don't have data
      {
        id: "default",
        title: "Sim Racing Hub",
        subtitle: "Your gateway to the world of competitive sim racing",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2070&auto=format&fit=crop",
        badge: "Featured",
        link: "/sim-racing",
        icon: <Trophy />,
        color: "bg-purple-600"
      }
    ];

    // Add league slides
    if (leagues && leagues.length > 0) {
      const leagueSlides = leagues.slice(0, 2).map(league => ({
        id: league.id,
        title: league.name,
        subtitle: league.description || "Join our competitive sim racing league with racers from around the world",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2070&auto=format&fit=crop",
        badge: "League",
        link: `/sim-racing/leagues/${league.id}`,
        icon: <Trophy />,
        color: "bg-purple-600"
      }));
      newSlides.push(...leagueSlides);
    }

    // Add event slides
    if (events && events.length > 0) {
      const eventSlides = events.slice(0, 2).map(event => ({
        id: event.id,
        title: event.title,
        subtitle: event.description || `Race day on ${event.track || 'our featured circuit'}`,
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2070&auto=format&fit=crop",
        badge: "Event",
        link: `/sim-racing/events/${event.id}`,
        icon: <Calendar />,
        color: "bg-orange-500"
      }));
      newSlides.push(...eventSlides);
    }

    // Add garage/services slides
    if (garages && garages.length > 0) {
      const garageSlides = garages.slice(0, 2).map(garage => ({
        id: garage.id,
        title: garage.name,
        subtitle: "Professional sim racing services and equipment",
        image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2070&auto=format&fit=crop",
        badge: "Services",
        link: `/sim-racing/garages/${garage.id}`,
        icon: <Settings />,
        color: "bg-blue-600"
      }));
      newSlides.push(...garageSlides);
    }

    // If we added content slides, remove the default slide
    if (newSlides.length > 1) {
      newSlides.shift(); // Remove default slide
    }

    setSlides(newSlides);
    setIsLoaded(true);
  }, [leagues, events, garages, isLeaguesLoading, isEventsLoading, isGaragesLoading]);

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance slides with timer
  useEffect(() => {
    if (!isLoaded || slides.length <= 1) return;

    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isLoaded, slides.length]);

  if (!isLoaded || slides.length === 0) {
    return (
      <div className="h-[60vh] bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 animate-pulse"></div>
    );
  }

  return (
    <div className="relative h-[60vh] md:h-[75vh] overflow-hidden bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900">
      {/* Abstract pattern overlay */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 L 40 20 M 20 0 L 20 40" stroke="white" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-[20%] right-[15%] w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>

      {/* Slides */}
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => (
          index === currentIndex && (
            <motion.div
              key={slide.id}
              className="absolute inset-0 flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Content */}
                  <motion.div 
                    className="text-white"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <div className={cn("p-2 rounded-md", slide.color)}>
                        {slide.icon}
                      </div>
                      <span className="text-sm font-medium uppercase tracking-wider text-purple-200">{slide.badge}</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                    <p className="text-lg text-gray-200 mb-8 max-w-lg">{slide.subtitle}</p>
                    
                    <NextLink href={slide.link as any}>
                      <Button 
                        size="lg" 
                        className="bg-white text-purple-900 hover:bg-purple-100 group"
                      >
                        Learn More
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                      </Button>
                    </NextLink>
                  </motion.div>
                  
                  {/* Image */}
                  <motion.div
                    className="hidden lg:block"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <div className="relative overflow-hidden rounded-lg border border-white/20 shadow-2xl aspect-[4/3]">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Navigation controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="border border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex space-x-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIndex 
                  ? "bg-white w-8" 
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="border border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default SimRacingSlideshow;

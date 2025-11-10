
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import NextLink from "next/link";

interface EventSlideshowProps {
  events: any[];
}

export const EventSlideshow: React.FC<EventSlideshowProps> = ({ events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
  };

  useEffect(() => {
    // Auto-advance slides if autoplay is enabled
    let timer: NodeJS.Timeout;
    
    if (isAutoPlaying) {
      timer = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentIndex, isAutoPlaying, events.length]);

  // Pause autoplay when user interacts, resume after timeout
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
    const timer = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 60000); // Resume autoplay after 10 seconds of inactivity
    return () => clearTimeout(timer);
  };

  if (!events || events.length === 0) {
    return null;
  }

  const currentEvent = events[currentIndex];
  
  return (
    <div 
      className="relative h-[500px] w-full overflow-hidden bg-black" 
      onClick={handleUserInteraction}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${currentEvent.banner_image_url || '/placeholder.svg'})`,
              filter: 'brightness(0.6)'
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col items-start justify-center p-6 text-white md:p-16 z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-lg"
            >
              <span className="inline-block px-3 py-1 mb-4 text-sm font-medium rounded-full bg-sm-red text-white">
                {currentEvent.category}
              </span>
              
              <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">
                {currentEvent.title}
              </h1>
              
              <p className="mb-4 text-base md:text-lg md:pr-12 line-clamp-3">
                {currentEvent.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-red-400" />
                  <span>
                    {new Date(currentEvent.start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                {currentEvent.venue && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-red-400" />
                    <span>{currentEvent.venue}, {currentEvent.city || ''}</span>
                  </div>
                )}
              </div>
              
              <Button asChild className="bg-sm-red hover:bg-sm-red">
                <NextLink href={`/events/${currentEvent.id}`}>View Details</NextLink>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="hidden md:block absolute left-4 top-1/2 z-30 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="hidden md:block absolute right-4 top-1/2 z-30 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>
      
      {/* Slide indicators/progress dots */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2">
        {events.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`h-2 w-8 rounded-full transition-all ${
              idx === currentIndex ? "bg-sm-red" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

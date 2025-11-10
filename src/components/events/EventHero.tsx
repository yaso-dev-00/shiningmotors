
import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_date: string;
  venue: string;
  city: string;
  banner_image_url: string;
}

interface EventHeroProps {
  featuredEvents: Event[];
}

const EventHero: React.FC<EventHeroProps> = ({ featuredEvents }) => {
  const featuredEvent = featuredEvents[0];
  
  if (!featuredEvent) return null;
  
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="relative h-[500px] w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${featuredEvent.banner_image_url || '/placeholder.svg'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-90" />
        
        {/* Content */}
        <div className="container relative h-full flex flex-col justify-center text-white z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-3 py-1 mb-4 text-sm font-medium rounded-full bg-purple-600 text-white">
              {featuredEvent.category}
            </span>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              {featuredEvent.title}
            </h1>
            
            <p className="text-lg text-gray-200 mb-6 line-clamp-2">
              {featuredEvent.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                <span>
                  {new Date(featuredEvent.start_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-400" />
                <span>{featuredEvent.venue}, {featuredEvent.city}</span>
              </div>
            </div>
            
            <div>
              <a 
                href={`/events/${featuredEvent.id}`} 
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
              >
                View Details
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventHero;

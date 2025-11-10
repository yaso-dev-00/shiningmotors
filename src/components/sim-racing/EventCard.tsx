
import React from 'react';
import { motion } from 'framer-motion';
import NextLink from "next/link";
import { Calendar, Clock, MapPin, Car } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { SimEvent } from '@/integrations/supabase/modules/simAppPage';

interface EventCardProps {
  event: SimEvent;
  index?: number;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index = 0 }) => {
  const startDate = event.start_date ? new Date(event.start_date) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full transition-all hover:shadow-lg overflow-hidden border-t-4 border-t-orange-500">
        <CardHeader className="pb-2">
          <div className="flex items-center mb-1">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 mr-2 font-medium">
              {event.event_type}
            </Badge>
            {event.platform && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                {event.platform}
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 text-sm">
            {startDate && (
              <div className="flex items-center text-gray-600">
                <Calendar size={16} className="text-orange-500 mr-2" />
                <span>
                  {format(startDate, 'PPP')}
                  {event.end_date && ` - ${format(new Date(event.end_date), 'PPP')}`}
                </span>
              </div>
            )}
            
            {event.track && (
              <div className="flex items-center text-gray-600">
                <MapPin size={16} className="text-orange-500 mr-2" />
                <span>{event.track}</span>
              </div>
            )}
            
            {event.car_class && (
              <div className="flex items-center text-gray-600">
                <Car size={16} className="text-orange-500 mr-2" />
                <span>{event.car_class}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <NextLink href={`/sim-racing/events/${event.id}`} className="w-full">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">View Event</Button>
          </NextLink>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

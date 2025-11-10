"use client";
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { EventCard } from '@/components/sim-racing/EventCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const SimRacingEvents = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filterOpen, setFilterOpen] = useState(false);

  // Upcoming events
  const { data: upcomingEvents = [], isLoading: isUpcomingLoading } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      const { data, error } = await simAppApi.events.getUpcomingEvents(20);
      if (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
      }
      return data || [];
    },
    enabled: typeof window !== 'undefined',
  });
  const { data: pastEvents = [], isLoading: ispastLoading } = useQuery({
    queryKey: ['pastEvents'],
    queryFn: async () => {
      const { data, error } = await simAppApi.events.getPastEvents()
      if (error) {
        console.error("Error fetching past events:", error);
        return [];
      }
      return data || [];
    },
    enabled: typeof window !== 'undefined',
  });
  const { data: onGoingEvents = [], isLoading: isOngoingLoading } = useQuery({
    queryKey: ['onGoingEvents'],
    queryFn: async () => {
      const { data, error } = await simAppApi.events.getOngoingEvent();
      if (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
      }
      return data || [];
    },
    enabled: typeof window !== 'undefined',
  });
console.log(onGoingEvents)
const router = useRouter()
  return (
    <Layout>
     
      <div className="container mx-auto px-4 py-8">
         <Button
                variant="ghost"
                onClick={() => router.push('/sim-racing')}
                className="mb-6 px-0"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to SIM Page
              </Button>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Sim Racing Events</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join exciting races and competitive events
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </motion.div>

        {filterOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <select className="w-full rounded-md border border-gray-300 p-2">
                  <option value="">All Types</option>
                  <option value="race">Race</option>
                  <option value="time_trial">Time Trial</option>
                  <option value="championship">Championship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <select className="w-full rounded-md border border-gray-300 p-2">
                  <option value="">All Platforms</option>
                  <option value="iracing">iRacing</option>
                  <option value="assetto_corsa">Assetto Corsa</option>
                  <option value="rfactor2">rFactor 2</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">Apply Filters</Button>
              </div>
            </div>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-8">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Upcoming Events */}
          <TabsContent value="upcoming">
            {isUpcomingLoading || isOngoingLoading || ispastLoading? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <div>
                      <Skeleton className="h-6 w-2/3 rounded" />
                      <Skeleton className="h-4 w-full mt-2 rounded" />
                      <Skeleton className="h-4 w-3/4 mt-1 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Today is {format(new Date(), 'MMMM d, yyyy')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No upcoming events at the moment. Check back soon!
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Ongoing Events */}
          <TabsContent value="ongoing">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {onGoingEvents.length > 0 ? (
                    onGoingEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No Active events at the moment. Check back soon!
                    </div>
                  )}
                </div>
          </TabsContent>

          {/* Past Events */}
          <TabsContent value="past">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pastEvents.length > 0 ? (
                    pastEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No past events at the moment. Check back soon!
                    </div>
                  )}
                </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SimRacingEvents;

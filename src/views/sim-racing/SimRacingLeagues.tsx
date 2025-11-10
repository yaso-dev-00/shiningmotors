"use client";
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { LeagueCard } from '@/components/sim-racing/LeagueCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SimRacingLeagues = () => {
  const [activeTab, setActiveTab] = useState('active');

  // Active leagues
  const { data: activeLeagues = [], isLoading: isActiveLoading } = useQuery({
    queryKey: ['activeLeagues'],
    queryFn: async () => {
      const { data, error } = await simAppApi.leagues.getActiveLeagues();
      if (error) {
        console.error("Error fetching active leagues:", error);
        return [];
      }
      return data || [];
    },
  });

  // Upcoming leagues
  const { data: upcomingLeagues = [], isLoading: isUpcomingLoading } = useQuery({
    queryKey: ['upcomingLeagues'],
    queryFn: async () => {
      const { data, error } = await simAppApi.leagues.getUpcomingLeagues(10);
      if (error) {
        console.error("Error fetching upcoming leagues:", error);
        return [];
      }
      return data || [];
    },
  });

  // Past leagues - We'll need to add this to the simAppApi
  const { data: pastLeagues = [], isLoading: isPastLoading } = useQuery({
    queryKey: ['pastLeagues'],
    queryFn: async () => {
      // This is a placeholder - you would need to implement this endpoint
      // in the simAppApi to fetch past leagues
       const { data, error } = await simAppApi.leagues.getPastLeagues();
      if (error) {
        console.error("Error fetching upcoming leagues:", error);
        return [];
      }
      return data || [];
      return [];
    },
  });
  const router = useRouter();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
                        variant="ghost"
                        onClick={() => router.push('/sim-racing' as any)}
                        className="mb-6 px-0"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to SIM Page
                      </Button>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Sim Racing Leagues</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Join competitive racing leagues and climb the leaderboards
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-8 overflow-auto scrollbar-hide">
            <TabsTrigger value="active">Active Leagues</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Leagues</TabsTrigger>
            <TabsTrigger value="past">Past Leagues</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboards</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Active Leagues */}
          <TabsContent value="active">
            {isActiveLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLeagues.length > 0 ? (
                  activeLeagues.map((league, index) => (
                    <LeagueCard key={league.id} league={league} index={index} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No active leagues at the moment. Check the upcoming leagues!
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Upcoming Leagues */}
          <TabsContent value="upcoming">
            {isUpcomingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingLeagues.length > 0 ? (
                  upcomingLeagues.map((league, index) => (
                    <LeagueCard key={league.id} league={league} index={index} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No upcoming leagues at the moment. Stay tuned for announcements!
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Past Leagues */}
          <TabsContent value="past">
            {isPastLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastLeagues.length > 0 ? (
                  pastLeagues.map((league, index) => (
                    <LeagueCard key={league.id} league={league} index={index} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    Archive of past leagues will appear here.
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Leaderboards */}
          <TabsContent value="leaderboard">
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Global Leaderboards</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Coming soon - Global sim racing leaderboards across all leagues will appear here.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="statistics">
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Racing Statistics</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Coming soon - Detailed statistics across all leagues including fastest laps, 
                  most wins, and other interesting metrics.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SimRacingLeagues;

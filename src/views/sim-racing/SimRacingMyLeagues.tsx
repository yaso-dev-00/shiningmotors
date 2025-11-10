"use client";
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Trophy, Users, Star } from "lucide-react";
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { toast } from '@/components/ui/use-toast';
import supabase from '@/integrations/supabase/client';

const SimRacingMyLeagues = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  
  const {
    data: leaguesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['simRacingUserLeagues', user?.id],
    queryFn: async () => {
    if (!user?.id) throw new Error("User not authenticated");
    const soloResponse = await simAppApi.leagues.getUserSoloLeagues(user.id);
if (soloResponse.error) throw soloResponse.error;

const { data: userTeamData, error: userTeamError } = await supabase
  .from('sim_teams')
  .select('id')
  .eq('creator_id', user.id);

if (userTeamError) throw userTeamError;

const teamIds = userTeamData?.map(item => item.id) || [];

const teamResponse = await simAppApi.leagues.getUserTeamLeagues(user.id);
if (teamResponse.error) throw teamResponse.error;

// Filter leagues to only include user's created teams
const filteredTeamData = (teamResponse.data || []).filter(item =>
  item.team_id && teamIds.includes(item.team_id)
);

return {
  solo: soloResponse.data || [],
  team: filteredTeamData,
};

    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading leagues",
        description: "Failed to load your league registrations. Please try again.",
        variant: "destructive"
      });
    }
  }, [error]);

  // Combine solo and team leagues
  const allLeagues = React.useMemo(() => {
    if (!leaguesData) return [];
    
    const soloLeagues = leaguesData.solo.map(item => ({
      ...item,
      registrationType: 'solo' as const
    }));
    
    const teamLeagues = leaguesData.team.map(item => ({
      ...item,
      registrationType: 'team' as const
    }));
    
    return [...soloLeagues, ...teamLeagues];
  }, [leaguesData]);

  console.log(allLeagues)
  // Filter leagues based on active tab
  const filteredLeagues = React.useMemo(() => {
    if (!allLeagues.length) return [];

    const now = new Date();
    
    return allLeagues.filter(item => {
      const league = item.registrationType === 'solo' 
        ? item.sim_leagues 
        : item.sim_leagues
        
      if (!league) return false;
      
      const startDate = league.start_date ? new Date(league.start_date) : null;
      const endDate = league.end_date ? new Date(league.end_date) : null;
      
      if (activeTab === 'active') {
        return (startDate && startDate <= now) && (!endDate || endDate >= now);
      } else if (activeTab === 'upcoming') {
        return startDate && startDate > now;
      } else if (activeTab === 'completed') {
        return endDate && endDate < now;
      }
      
      return true;
    });
  }, [allLeagues, activeTab]);
console.log(leaguesData,filteredLeagues)
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">My Sim Racing Leagues</h1>
        
        <Tabs defaultValue="active" onValueChange={setActiveTab}>
          <div className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredLeagues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeagues.map((item) => (
                <LeagueCard 
                  key={`${item.registrationType}-${item.id}`} 
                  leagueItem={item} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">
                No {activeTab === 'active' ? 'active' : activeTab === 'upcoming' ? 'upcoming' : 'completed'} leagues
              </h3>
              <p className="text-gray-500">
                {activeTab === 'active' 
                  ? "You're not currently participating in any active leagues." 
                  : activeTab === 'upcoming' 
                    ? "You haven't registered for any upcoming leagues yet."
                    : "You haven't participated in any completed leagues yet."}
              </p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = '/sim-racing/leagues'}
              >
                Browse Leagues
              </Button>
            </div>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

interface LeagueItem {
  id: string;
  registrationType: 'solo' | 'team';
  car_class?: string | null;
  car_number?: number | null;
  total_points?: number | null;
  status?: string | null;
  team?: { name: string } | null;
  sim_leagues?: {
    id?: string;
    name?: string | null;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
}

interface LeagueCardProps {
  leagueItem: LeagueItem;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ leagueItem }) => {
  // Extract league data and participant data from the registration
  const league = leagueItem.sim_leagues;
  const registration = leagueItem;
  const isTeam = leagueItem.registrationType === 'team';
  
  const startDate = league?.start_date 
    ? new Date(league.start_date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) 
    : 'Date not specified';
  
  const endDate = league?.end_date
    ? new Date(league.end_date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) 
    : 'Ongoing';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{league?.name || 'Unknown League'}</CardTitle>
            <div className="flex gap-2 text-sm text-gray-500 mt-1">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{startDate} - {endDate}</span>
            </div>
          </div>
          {isTeam && (
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Team
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm line-clamp-2">{league?.description || 'No description available.'}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          {registration.car_class && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Car Class:</span>
              <span className="font-medium">{registration.car_class}</span>
            </div>
          )}
          
          {registration.car_number && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Car Number:</span>
              <span className="font-medium">{registration.car_number}</span>
            </div>
          )}
          
          {isTeam && registration.team && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Team:</span>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-500 mr-1" />
                <span className="font-medium">{registration.team.name}</span>
              </div>
            </div>
          )}
          
          {registration.total_points !== null && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total Points:</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-medium">{registration.total_points}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status:</span>
            <span className="font-medium capitalize">{registration.status}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.location.href = `/sim-racing/leagues/${league?.id}`}
          >
            View League Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimRacingMyLeagues;

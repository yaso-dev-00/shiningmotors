
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Trophy, 
  MapPin, 
  Clock, 
  Users,
  Star,
  ExternalLink 
} from 'lucide-react';
import NextLink from "next/link";
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '../Layout';

interface RegistrationHistoryProps {
  userId?: string;
}

const SimSoloRegistrationHistory: React.FC<RegistrationHistoryProps> = ({ userId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [leagueRegistrations, setLeagueRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    window.scrollTo(0,0)
    if (targetUserId) {
      fetchRegistrationHistory();
    }
  }, [targetUserId]);

  const fetchRegistrationHistory = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      
      // Fetch event registrations
      const { data: events, error: eventsError } = await simAppApi.events.getRegisteredEvents(targetUserId);
      if (eventsError) throw eventsError;
      
      // Fetch league registrations
      const { data: leagues, error: leaguesError } = await simAppApi.leagues.getUserSoloLeagues(targetUserId);
      if (leaguesError) throw leaguesError;
      
      setEventRegistrations(events || []);
      setLeagueRegistrations(leagues || []);
    } catch (error) {
      console.error('Error fetching registration history:', error);
      toast({
        title: "Error",
        description: "Failed to load registration history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (now < startDate) return { label: 'Upcoming', variant: 'default' as const };
    if (now >= startDate && now <= endDate) return { label: 'Ongoing', variant: 'destructive' as const };
    return { label: 'Completed', variant: 'secondary' as const };
  };

  const getLeagueStatus = (league: any) => {
    const now = new Date();
    const startDate = new Date(league.start_date);
    const endDate = new Date(league.end_date);
    
    if (now < startDate) return { label: 'Upcoming', variant: 'default' as const };
    if (now >= startDate && now <= endDate) return { label: 'Active', variant: 'destructive' as const };
    return { label: 'Completed', variant: 'secondary' as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading registration history...</span>
          </div>
        </CardContent>
      </Card>
      </Layout>
    );
  }

  return (
    <Layout>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Sim Event Registrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">
              Events ({eventRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value="leagues">
              Leagues ({leagueRegistrations.length})
            </TabsTrigger>
          </TabsList> */}

          <div className="mt-4">
            {eventRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Event Registrations</h3>
                <p className="text-gray-600 mb-4">You haven't registered for any sim racing events yet</p>
                <NextLink href="/sim-racing/events">
                  <Button>Browse Events</Button>
                </NextLink>
              </div>
            ) : (
              <div className="space-y-4">
                {eventRegistrations.map((registration: any) => {
                  const event = registration.event;
                  const status = getEventStatus(event);
                  
                  return (
                    <div key={registration.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-gray-600 text-sm">{event.description}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(event.start_date)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.track}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {event.car_class}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Registered: {formatDate(registration.registration_date)}
                        </div>
                      </div>

                      {registration.car_number && (
                        <div className="mb-3">
                          <Badge variant="outline">Car #{registration.car_number}</Badge>
                          {registration.points_earned > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {registration.points_earned} points
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Status: {registration.status}
                        </span>
                        <NextLink href={`/sim-racing/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Event
                          </Button>
                        </NextLink>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* <TabsContent value="leagues" className="mt-4">
            {leagueRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No League Registrations</h3>
                <p className="text-gray-600 mb-4">You haven't joined any sim racing leagues yet</p>
                <Link to="/sim-racing/leagues">
                  <Button>Browse Leagues</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {leagueRegistrations.map((registration: any) => {
                  const league = registration.sim_leagues;
                  const status = getLeagueStatus(league);
                  
                  return (
                    <div key={registration.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{league.name}</h3>
                          <p className="text-gray-600 text-sm">{league.description}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(league.start_date)} - {formatDate(league.end_date)}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Max: {league.max_participants || 'Unlimited'}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {registration.car_class}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Joined: {formatDate(registration.registration_date)}
                        </div>
                      </div>

                      <div className="mb-3">
                        {registration.car_number && (
                          <Badge variant="outline">Car #{registration.car_number}</Badge>
                        )}
                        <Badge variant="secondary" className="ml-2">
                          {registration.total_points} total points
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Status: {registration.status}
                        </span>
                        <Link to={`/sim-racing/leagues/${league.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View League
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent> */}
        {/* </Tabs> */}
      </CardContent>
    </Card>
    </Layout>
  );
};

export default SimSoloRegistrationHistory;

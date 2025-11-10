"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad, Calendar, Clock, Medal, Users, ChevronLeft, AlertCircle, Trophy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SimEventRegistrationForm from '@/components/sim-racing/SimEventRegistrationForm';
import supabase from '@/integrations/supabase/client';

const SimRacingEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const {
    data: event,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['simEvent', id],
    queryFn: async () => await simAppApi.events.getEventDetails(id!),
    enabled: !!id && typeof window !== 'undefined',
  });

  const {
    data: registrationStatus,
    isLoading: isLoadingRegistration,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['simEventRegistration', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return { isRegistered: false };

      const { data, error } = await supabase
        .from('sim_event_participants_solo')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', id)
        .maybeSingle();

      if (error) throw error;
      return { isRegistered: !!data, registration: data };
    },
    enabled: !!id && !!user?.id && typeof window !== 'undefined',
  });

  const {
    data: leagueStandings,
    isLoading: participantsLoading,
    refetch: refetchParticipants
  } = useQuery({
    queryKey: ['participants', event?.data?.league_id],
    enabled: !!event?.data?.league_id && typeof window !== 'undefined',
    queryFn: async () => {
      if (!event?.data?.league_id) throw new Error("League ID not available");
      
      const leagueId = event.data.league_id;
      console.log(leagueId)

      const { data: team, error } = await simAppApi.leagues.getTeamLeagueStandings(leagueId);
      // console.log(data)
      //      const participants=await Promise.all(
      //           data.map(async(item)=>{
      //               const {data,error}=await simAppApi.teams.getTeamDrivers(item.team_id)
      //               if(error) return error
      //               return data
      //           })
      //      )
      if (error) throw error;
      const { data: solo, error: soloError } = await simAppApi.leagues.getLeagueStandings(leagueId)
      if (soloError) throw soloError;


      return { solo: solo || [], teams: team || [] };
    }
  });

  // useEffect(()=>{
  //   console.log(event)
  //    if(event?.data?.league_id)
  //    {
  //        refetchParticipants()
  //    }
  // },[event])
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !event?.data) {

    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Event not found</h2>
            <p className="text-gray-500 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push('/sim-racing/events' as any)}>Back to Events</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const eventData = event.data;
  const isRegistered = registrationStatus?.isRegistered || false;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegistration = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to register for this event",
        variant: "destructive"
      });
      router.push('/auth' as any);
      return;
    }

    setShowRegistrationForm(true);
  };

  const handleRegistrationComplete = () => {
    setShowRegistrationForm(false);
    refetch();
    refetchStatus()
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/sim-racing/events' as any)}
          className="mb-6 px-0"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{eventData.title}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center">
                  <Gamepad className="mr-1 h-4 w-4" />
                  {eventData.platform || 'All Platforms'}
                </Badge>
                <Badge variant="outline" className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDate(eventData.start_date)}
                  {eventData.start_date && formatTime(eventData.start_date) && ` at ${formatTime(eventData.start_date)}`}
                </Badge>
                <Badge variant={eventData.event_type === 'race' ? 'destructive' : 'default'} className="flex items-center">
                  {eventData.event_type.charAt(0).toUpperCase() + eventData.event_type.slice(1)}
                </Badge>
              </div>

              <p className="text-gray-700 mb-6">{eventData.description}</p>

              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                  {eventData.results && <TabsTrigger value="results">Results</TabsTrigger>}
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm text-gray-500 mb-2">Event Information</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Format:</dt>
                            <dd className="text-sm font-medium">{eventData.format || 'Standard'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Track:</dt>
                            <dd className="text-sm font-medium">{eventData.track || 'TBA'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Car Class:</dt>
                            <dd className="text-sm font-medium">{eventData.car_class || 'Open'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Max Participants:</dt>
                            <dd className="text-sm font-medium">{eventData.max_participants || 'Unlimited'}</dd>
                          </div>
                          {eventData.league_id && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">League:</dt>
                              <dd className="text-sm font-medium">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto"
                                  onClick={() => router.push(`/sim-racing/leagues/${eventData.league_id}` as any)}
                                >
                                  {eventData.league?.name || 'View League'}
                                </Button>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm text-gray-500 mb-2">Schedule</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Start Date:</dt>
                            <dd className="text-sm font-medium">{formatDate(eventData.start_date)}</dd>
                          </div>
                          {eventData.start_date && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Start Time:</dt>
                              <dd className="text-sm font-medium">{formatTime(eventData.start_date)}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">End Date:</dt>
                            <dd className="text-sm font-medium">{eventData.end_date ? formatDate(eventData.end_date) : 'Same day'}</dd>
                          </div>
                          {eventData.end_date && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">End Time:</dt>
                              <dd className="text-sm font-medium">{formatTime(eventData.end_date)}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Registration:</dt>
                            <dd className="text-sm font-medium">{eventData.registration_type}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>

                  {eventData.car_setup && (
                    <div>
                      <h3 className="font-medium mb-2">Car Setup Information</h3>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm whitespace-pre-wrap">{eventData.car_setup}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="participants">
                  {participantsLoading ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading participants...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Solo Standings */}
                      {leagueStandings?.solo && leagueStandings.solo.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3 flex items-center">
                            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                            Driver Standings
                          </h3>
                          <div className="bg-white rounded-md overflow-y-scroll scrollbar-hide shadow">
                            <table className="min-w-full divide-y overflow-y-auto divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Driver
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Car #
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Points
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200 ">
                                {leagueStandings.solo.map((entry: { id: string; total_points: number | null; car_number: number | null; sim_user: { id: string; username: string | null; profile_picture: string | null } | null }, index: number) => (
                                  <tr key={entry.id} className={index === 0 ? "bg-yellow-50" : ""}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8">
                                          {entry.sim_user?.profile_picture ? (
                                            <img
                                              className="h-8 w-8 rounded-full"
                                              src={entry.sim_user?.profile_picture}
                                              alt=""
                                            />
                                          ) : (
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                              <Users className="h-4 w-4 text-gray-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="ml-4">
                                          <div className={`${user && user?.id === entry.sim_user?.id && "text-sm-red"} text-sm font-medium text-gray-900`}>
                                            {entry.sim_user?.username || 'Unknown'}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {entry.car_number?.toString() || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                      {entry.total_points}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Team Standings */}
                      {leagueStandings?.teams && leagueStandings.teams.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3 flex items-center">
                            <Users className="h-5 w-5 mr-2 text-blue-500" />
                            Team Standings
                          </h3>
                          <div className="bg-white rounded-md overflow-scroll scrollbar-hide shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Team
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Car #
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Points
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {leagueStandings.teams.map((entry: { id: string; total_points: number | null; car_number: number | null; sim_teams: { name: string | null; logo: string | null } | null }, index: number) => (
                                  <tr key={entry.id} className={index === 0 ? "bg-blue-50" : ""}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8">
                                          {entry.sim_teams?.logo ? (
                                            <img
                                              className="h-8 w-8 rounded-full"
                                              src={entry.sim_teams.logo}
                                              alt=""
                                            />
                                          ) : (
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                              <Users className="h-4 w-4 text-blue-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {entry.sim_teams?.name || 'Unknown Team'}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {entry.car_number?.toString() || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                      {entry.total_points}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {
                    !((leagueStandings?.teams?.length ?? 0) > 0 || (leagueStandings?.solo?.length ?? 0) > 0) && (
                      <div className="py-6 text-center">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">Participants</h3>
                        <p className="text-gray-500">
                          Participants list will be displayed here once registrations are processed.
                        </p>
                      </div>
                    )
                  }

                </TabsContent>

                {eventData.results && (
                  <TabsContent value="results">
                    <div className="py-4 text-center">
                      <Medal className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Results</h3>
                      <p className="text-gray-500">
                        Event results will be displayed here after the event is completed.
                      </p>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-primary p-4 text-primary-foreground">
                <h3 className="text-lg font-medium">Registration</h3>
              </div>
              <CardContent className="p-4">
                {showRegistrationForm ? (
                  <SimEventRegistrationForm
                    eventId={id!}
                    onRegistrationComplete={handleRegistrationComplete}
                    carClasses={[eventData.car_class || "Open"].filter(Boolean)}
                  />
                ) : isRegistered ? (
                  <div className="text-center py-4">
                    <div className="bg-green-100 text-green-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-4">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium mb-1">You're registered!</h4>
                    <p className="text-sm text-gray-500 mb-4">You have successfully registered for this event.</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/sim-racing/my-events' as any)}
                    >
                      View My Events
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      {eventData.start_date && new Date(eventData.start_date) > new Date()
                        ? 'Register now to participate in this exciting event!'
                        : 'This event has already started or ended.'}
                    </p>

                    <Button
                      className="w-full"
                      onClick={handleRegistration}
                      disabled={!eventData.start_date || new Date(eventData.start_date) <= new Date()}
                    >
                      Register Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {eventData.creator && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Organized by</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      {eventData.creator.avatar_url ? (
                        <img
                          src={eventData.creator.avatar_url}
                          alt={eventData.creator.username || 'Organizer'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{eventData.creator.username || 'Organizer'}</p>
                      {eventData.creator?.id && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm text-gray-500"
                          onClick={() => router.push(`/profile/${eventData.creator!.id}` as any)}
                        >
                          View Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// CheckIcon component
const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default SimRacingEventDetail;

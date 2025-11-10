"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gamepad,
  Calendar,
  ChevronLeft,
  Users,
  Trophy,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import SimLeagueRegistrationForm from "@/components/sim-racing/SimLeagueRegistrationForm";

const SimRacingLeagueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const {
    data: league,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["simLeague", id],
    queryFn: async () => await simAppApi.leagues.getLeagueDetails(id!),
    enabled: !!id,
  });

  const {
    data: registrationStatus,
    isLoading: isLoadingRegistration,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["simLeagueRegistration", id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return { isRegistered: false };

      const { data: soloData, error: soloError } = await supabase
        .from("sim_league_participants_solo")
        .select("*")
        .eq("user_id", user.id)
        .eq("league_id", id)
        .maybeSingle();

      if (soloError) throw soloError;

      // Also check team registration
      const { data: userTeamData, error: userTeamError } = await supabase
        .from("sim_teams")
        .select("id")
        .eq("creator_id", user.id);

      if (userTeamError) throw userTeamError;

      const teamids = userTeamData.map((item: { id: string }) => item.id);
      let teamRegistration = null;

      if (userTeamData.length) {
        const { data: teamRegData, error: teamRegError } = await supabase
          .from("sim_league_participants_team")
          .select("*")
          .eq("league_id", id);
        console.log(teamRegData);

        if (teamRegError) throw teamRegError;
        const filterleagueData = teamRegData?.find((item) =>
          item.team_id && teamids.includes(item.team_id)
        );

        teamRegistration = filterleagueData;
        console.log(teamRegistration);
      }
      console.log(soloData);
      return {
        isRegistered: !!(soloData || teamRegistration),
        soloRegistration: soloData,
        teamRegistration,
      };
    },
    enabled: !!id && !!user?.id,
  });

  const { data: leagueEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["simLeagueEvents", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await simAppApi.events.getEventByLeagueId(id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: leagueStandings, isLoading: isLoadingStandings } = useQuery({
    queryKey: ["simLeagueStandings", id],
    queryFn: async () => {
      if (!id) return { solo: [], teams: [] };
      const { data: solo, error } = await simAppApi.leagues.getLeagueStandings(
        id
      );
      const { data: team, error: teamError } =
        await simAppApi.leagues.getTeamLeagueStandings(id);
      // const data=await Promise.all(
      //       team.map(async(item)=>{
      //          const {data:drivers}=await simAppApi.teams.getTeamDrivers(item.team_id)
      //          return drivers
      //       })
      // )

      // console.log("no",team,data)
      if (teamError) throw teamError;
      if (error) throw error;
      return { solo: solo || [], teams: team || [] };
    },
    enabled: !!id,
  });
  console.log(leagueStandings);
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
  console.log(leagueStandings);
  if (error || !league?.data) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">League not found</h2>
            <p className="text-gray-500 mb-4">
              The league you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/sim-racing/leagues" as any)}>
              Back to Leagues
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const leagueData = league.data;
  const isRegistered = registrationStatus?.isRegistered || false;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRegistration = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to register for this league",
        variant: "destructive",
      });
      router.push("/auth" as any);
      return;
    }

    setShowRegistrationForm(true);
  };

  const handleRegistrationComplete = () => {
    setShowRegistrationForm(false);
    refetch();
    refetchStatus();
  };

  return (
    <Layout>
      <div className="container mx-auto py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/sim-racing/leagues" as any)}
          className="mb-6 px-0"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Leagues
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{leagueData.name}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center">
                  <Gamepad className="mr-1 h-4 w-4" />
                  {leagueData.platform || "All Platforms"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(leagueData.start_date)} -{" "}
                    {formatDate(leagueData.end_date)}
                  </span>
                </Badge>
                <Badge variant="default">
                  {leagueData.registration_type === "invitation_only"
                    ? "Solo Drivers"
                    : leagueData.registration_type === "team"
                    ? "Teams Only"
                    : "Solo & Teams"}
                </Badge>
              </div>

              <p className="text-gray-700 mb-6">{leagueData.description}</p>

              <Tabs defaultValue="events">
                <TabsList>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="standings">Standings</TabsTrigger>
                  <TabsTrigger value="rules">Rules & Info</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="space-y-4 pt-4">
                  {isLoadingEvents ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading events...</p>
                    </div>
                  ) : leagueEvents && leagueEvents.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      {leagueEvents.map((event: any) => (
                        <Card key={event.id} className="overflow-hidden">
                          <div className="bg-muted p-4">
                            <h3 className="font-medium">{event.title}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(event.start_date)}
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <p className="text-sm line-clamp-2 mb-3">
                              {event.description || "No description available."}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                router.push(`/sim-racing/events/${event.id}` as any)
                              }
                            >
                              View Event
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium mb-1">
                        No events scheduled yet
                      </h3>
                      <p className="text-gray-500">
                        Events for this league will be announced soon.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="standings" className="pt-4">
                  {isLoadingStandings ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading standings...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Solo Standings */}
                      {leagueStandings?.solo &&
                        Array.isArray(leagueStandings.solo) &&
                        leagueStandings.solo.length > 0 && (
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
                                  {leagueStandings.solo.map((entry: any, index: number) => (
                                    <tr
                                      key={entry.id}
                                      className={
                                        index === 0 ? "bg-yellow-50" : ""
                                      }
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {index + 1}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0 h-8 w-8">
                                            {entry.sim_user?.profile_picture ? (
                                              <img
                                                className="h-8 w-8 rounded-full"
                                                src={
                                                  entry.sim_user
                                                    ?.profile_picture
                                                }
                                                alt=""
                                              />
                                            ) : (
                                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-gray-500" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="ml-4">
                                            <div
                                              className={`${
                                                user &&
                                                user?.id === entry.sim_user?.id &&
                                                "text-sm-red"
                                              } text-sm font-medium text-gray-900`}
                                            >
                                              {entry.sim_user?.username ||
                                                "Unknown"}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.car_number || "—"}
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
                      {leagueStandings?.teams &&
                        Array.isArray(leagueStandings.teams) &&
                        leagueStandings.teams.length > 0 && (
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
                                  {leagueStandings.teams.map((entry: any, index: number) => (
                                    <tr
                                      key={entry.id}
                                      className={
                                        index === 0 ? "bg-blue-50" : ""
                                      }
                                    >
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
                                              {entry.sim_teams?.name ||
                                                "Unknown Team"}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.car_number || "—"}
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

                      {!(
                        (Array.isArray(leagueStandings?.teams) && leagueStandings.teams.length > 0) ||
                        (Array.isArray(leagueStandings?.solo) && leagueStandings.solo.length > 0)
                      ) && (
                        <div className="py-6 text-center">
                          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-lg font-medium mb-1">
                            No standings yet
                          </h3>
                          <p className="text-gray-500">
                            League standings will appear here after events
                            begin.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rules" className="pt-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-4">League Information</h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Points System
                          </h4>
                          {leagueData.points_system ? (
                            <pre className="mt-1 text-sm bg-gray-50 p-3 rounded-md overflow-auto">
                              {JSON.parse(
                                JSON.stringify(
                                  leagueData.points_system,
                                  null,
                                  2
                                )
                              ).toString()}
                            </pre>
                          ) : (
                            <p className="mt-1 text-sm">
                              Standard points system will be used.
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Registration Type
                          </h4>
                          <p className="mt-1 text-sm">
                            {leagueData.registration_type === "solo"
                              ? "This league is for solo drivers only."
                              : leagueData.registration_type === "team"
                              ? "This league is for teams only."
                              : "This league accepts both solo drivers and teams."}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Max Participants
                          </h4>
                          <p className="mt-1 text-sm">
                            {leagueData.max_participants
                              ? `Limited to ${leagueData.max_participants} participants.`
                              : "No limit on the number of participants."}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Platform
                          </h4>
                          <p className="mt-1 text-sm capitalize">
                            {leagueData.platform || "All sim racing platforms"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-primary p-4 text-primary-foreground">
                <h3 className="text-lg font-medium">League Registration</h3>
              </div>
              <CardContent className="p-4">
                {showRegistrationForm ? (
                  <SimLeagueRegistrationForm
                    leagueId={id!}
                    leagueData={leagueData}
                    onRegistrationComplete={handleRegistrationComplete}
                  />
                ) : isRegistered ? (
                  <div className="text-center py-4">
                    <div className="bg-green-100 text-green-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-4">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium mb-1">You're registered!</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      You are registered for this league as{" "}
                      {registrationStatus?.teamRegistration
                        ? "a team"
                        : "a solo driver"}
                      .
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/sim-racing/my-leagues" as any)}
                    >
                      View My Leagues
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      {leagueData.start_date && new Date(leagueData.start_date) > new Date()
                        ? "Join this league to participate in all events!"
                        : "This league has already started."}
                    </p>

                    <Button
                      className="w-full"
                      onClick={handleRegistration}
                      disabled={!leagueData.start_date || new Date(leagueData.start_date) <= new Date()}
                    >
                      Register Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {leagueData.organizer && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Organized by</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      {leagueData.organizer.avatar_url ? (
                        <img
                          src={leagueData.organizer.avatar_url}
                          alt={leagueData.organizer.username || "Organizer"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {leagueData.organizer.username || "Organizer"}
                      </p>
                      {leagueData.organizer?.id && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm text-gray-500"
                          onClick={() =>
                            router.push(`/profile/${leagueData.organizer!.id}` as any)
                          }
                        >
                          View Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">League Timeline</h3>
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {leagueData.end_date ? "Time-limited" : "Ongoing"}
                  </Badge>
                </div>

                <div className="space-y-3 mt-3">
                  <TimelineItem
                    date={formatDate(leagueData.start_date)}
                    label="League Start"
                    isPast={leagueData.start_date ? new Date(leagueData.start_date) < new Date() : false}
                  />

                  {leagueEvents?.slice(0, 3).map((event: any) => (
                    <TimelineItem
                      key={event.id}
                      date={formatDate(event.start_date)}
                      label={event.title}
                      isPast={new Date(event.start_date) < new Date()}
                    />
                  ))}

                  {leagueData.end_date && (
                    <TimelineItem
                      date={formatDate(leagueData.end_date)}
                      label="League End"
                      isPast={new Date(leagueData.end_date) < new Date()}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// CheckIcon component
const CheckIcon = ({ className = "" }) => (
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

interface TimelineItemProps {
  date: string;
  label: string;
  isPast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ date, label, isPast }) => {
  return (
    <div className="flex items-start">
      <div
        className={`mt-1 rounded-full w-3 h-3 flex-shrink-0 ${
          isPast ? "bg-green-500" : "bg-gray-300"
        }`}
      ></div>
      <div className="ml-3">
        <p className="text-xs text-gray-500">{date}</p>
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
};

export default SimRacingLeagueDetail;

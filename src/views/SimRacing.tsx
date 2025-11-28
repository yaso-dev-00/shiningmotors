"use client";
import { useEffect, useState } from "react";

import { Layout } from "@/components/Layout";
import { SimRacingSection } from "@/components/sim-racing/SimRacingSection";
import { SimRacingHero } from "@/components/sim-racing/SimRacingHero";
import { LeagueCard } from "@/components/sim-racing/LeagueCard";
import { EventCard } from "@/components/sim-racing/EventCard";
import { ProductCard } from "@/components/sim-racing/ProductCard";
import { GarageCard } from "@/components/sim-racing/GarageCard";
import { LeaderboardCard } from "@/components/sim-racing/LeaderboardCard";
import type {
  SimLeague,
  SimEvent,
  SimProduct,
  SimGarage,
} from "@/integrations/supabase/modules/simAppPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

interface SimRacingProps {
  leagues: SimLeague[];
  events: SimEvent[];
  products: SimProduct[];
  garages: SimGarage[];
  leaderboards: any[];
  leaderboardEntries: any[];
}

const SimRacing = ({
  leagues,
  events,
  products,
  garages,
  leaderboards,
  leaderboardEntries,
}: SimRacingProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isLeaguesLoading = false;
  const isEventsLoading = false;
  const isProductsLoading = false;
  const isGaragesLoading = false;
  const isLeaderboardsLoading = false;

  // For the first leaderboard entries
  const isLeaderboardEntriesLoading = false;

  return (
    <Layout>
      <SimRacingHero />

      <div className="container px-4 mx-auto mt-8">
        <div className="flex flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-400">
            Sim Racing Hub
          </h1>

          {isAuthenticated && (
            <div className="flex gap-2">
              <NextLink href="/sim-racing/profile">
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCircle size={18} />
                  <span className="hidden sm:inline">My SIM Profile</span>
                </Button>
              </NextLink>
            </div>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="products">Equipment</TabsTrigger>
            <TabsTrigger value="garages">Services</TabsTrigger>
            <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-1">
              {/* Active Leagues Section */}
              <SimRacingSection
                title="Active Leagues"
                description="Ongoing competitive series - join now and climb the standings!"
                linkTo="/sim-racing/leagues"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {isLeaguesLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <div>
                          <Skeleton className="h-6 w-2/3 rounded" />
                          <Skeleton className="h-4 w-full mt-2 rounded" />
                          <Skeleton className="h-4 w-3/4 mt-1 rounded" />
                        </div>
                      </div>
                    ))
                  ) : leagues.length > 0 ? (
                    leagues
                      .slice(0, 4)
                      .map((league, index) => (
                        <LeagueCard
                          key={league.id}
                          league={league}
                          index={index}
                        />
                      ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No active leagues at the moment. Check back soon!
                    </div>
                  )}
                </div>
              </SimRacingSection>

              {/* Upcoming Events Section */}
              <SimRacingSection
                title="Upcoming Events"
                description="Register for these upcoming races and competitions"
                linkTo="/sim-racing/events"
                className="bg-gray-50 dark:bg-gray-900"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {isEventsLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <div>
                          <Skeleton className="h-6 w-2/3 rounded" />
                          <Skeleton className="h-4 w-full mt-2 rounded" />
                          <Skeleton className="h-4 w-3/4 mt-1 rounded" />
                        </div>
                      </div>
                    ))
                  ) : events.length > 0 ? (
                    events.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No upcoming events at the moment. Check back soon!
                    </div>
                  )}
                </div>
              </SimRacingSection>

              {/* Featured Products Section */}
              <SimRacingSection
                title="Featured Equipment"
                description="Upgrade your sim racing setup with our recommended gear"
                linkTo="/sim-racing/equipment"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {isProductsLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <div>
                          <Skeleton className="h-6 w-2/3 rounded" />
                          <Skeleton className="h-5 w-1/3 mt-2 rounded" />
                          <Skeleton className="h-8 w-full mt-4 rounded" />
                        </div>
                      </div>
                    ))
                  ) : products.length > 0 ? (
                    products
                      .slice(0, 4)
                      .map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={index}
                        />
                      ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No products available at the moment.
                    </div>
                  )}
                </div>
              </SimRacingSection>

              {/* Services Section */}
              <SimRacingSection
                title="Pro Services"
                description="Coaching, setups, and maintenance services for your sim racing needs"
                linkTo="/sim-racing/garages"
                className="bg-gray-50 dark:bg-gray-900"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isGaragesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <div>
                          <Skeleton className="h-6 w-2/3 rounded" />
                          <Skeleton className="h-4 w-full mt-2 rounded" />
                          <Skeleton className="h-4 w-3/4 mt-1 rounded" />
                        </div>
                      </div>
                    ))
                  ) : garages.length > 0 ? (
                    garages
                      .slice(0, 3)
                      .map((garage, index) => (
                        <GarageCard
                          key={garage.id}
                          garage={garage}
                          index={index}
                        />
                      ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No services available at the moment.
                    </div>
                  )}
                </div>
              </SimRacingSection>

              {/* Leaderboards Preview */}
              {leaderboards.length > 0 &&
                !isLeaderboardEntriesLoading &&
                leaderboardEntries.length > 0 && (
                  <SimRacingSection
                    title="Top Leaderboards"
                    description="See who's at the top of their game"
                    linkTo="/sim-racing/leaderboards"
                  >
                    <LeaderboardCard
                      title={leaderboards[0]?.title || "Top Times"}
                      entries={leaderboardEntries as (typeof leaderboardEntries[0] & {
                        user?: { id: string; username: string; avatar_url?: string } | null;
                        team?: { id: string; name: string; logo?: string } | null;
                      })[]}
                      className="max-w-2xl mx-auto"
                    />
                  </SimRacingSection>
                )}
            </div>
          </TabsContent>

          {/* League Tab Content */}
          <TabsContent value="leagues">
            <div className="space-y-8">
              {isLeaguesLoading ? (
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
                  {leagues.length > 0 ? (
                    leagues.map((league, index) => (
                      <LeagueCard
                        key={league.id}
                        league={league}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No leagues available at the moment. Check back soon!
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Events Tab Content */}
          <TabsContent value="events">
            <div className="space-y-8">
              {isEventsLoading ? (
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
                  {events.length > 0 ? (
                    events.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No upcoming events at the moment. Check back soon!
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Products Tab Content */}
          <TabsContent value="products">
            <div className="space-y-8">
              {isProductsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <div>
                        <Skeleton className="h-6 w-2/3 rounded" />
                        <Skeleton className="h-5 w-1/3 mt-2 rounded" />
                        <Skeleton className="h-8 w-full mt-4 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No products available at the moment.
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Garages Tab Content */}
          <TabsContent value="garages">
            <div className="space-y-8">
              {isGaragesLoading ? (
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
                  {garages.length > 0 ? (
                    garages.map((garage, index) => (
                      <GarageCard
                        key={garage.id}
                        garage={garage}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No services available at the moment.
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Leaderboards Tab Content */}
          <TabsContent value="leaderboards">
            <div className="space-y-8">
              {isLeaderboardsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-80 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : leaderboards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leaderboards.map((leaderboard, index) => {
                    const entriesForBoard =
                      index === 0 ? leaderboardEntries : [];

                    return (
                      <LeaderboardCard
                        key={leaderboard.id}
                        title={leaderboard.title}
                        entries={entriesForBoard.map((entry: any) => ({
                          ...entry,
                          user:
                            entry.user &&
                            typeof entry.user === "object" &&
                            "id" in entry.user &&
                            "username" in entry.user
                              ? {
                                  id: entry.user.id,
                                  username: entry.user.username || "",
                                  avatar_url:
                                    entry.user.avatar_url || undefined,
                                }
                              : null,
                          team:
                            entry.team &&
                            typeof entry.team === "object" &&
                            "id" in entry.team &&
                            "name" in entry.team
                              ? {
                                  id: entry.team.id,
                                  name: entry.team.name || "",
                                  logo: entry.team.logo || undefined,
                                }
                              : null,
                        }))}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No leaderboards available at the moment.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SimRacing;

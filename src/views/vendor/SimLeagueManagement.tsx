"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Plus, Edit, Trash2, Users, Calendar, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NextLink from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Back from './Back';
import type { Database } from '@/integrations/supabase/types';
import { useRouter } from "next/navigation"

type SimLeague = Database['public']['Tables']['sim_leagues']['Row'];

const SimLeagueManagement = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<SimLeague[]>([]);
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  const fetchLeagues = useCallback(async () => {
    if (!user) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/sim-leagues?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { setLeagues([]); return; }
        throw new Error(body?.error || "Failed to fetch sim leagues");
      }
      const body = await res.json();
      setLeagues((body?.data || []) as SimLeague[]);
    } catch (error: unknown) {
      console.error('Error fetching leagues:', error);
      toast({ title: "Error", description: "Failed to load sim leagues", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, session?.access_token, toast]);

  useEffect(() => { fetchLeagues(); }, [fetchLeagues]);
  useEffect(() => {
    if (!pathname?.includes("/vendor/simleague-management")) return;
    fetchLeagues();
  }, [pathname, fetchLeagues]);
  useEffect(() => {
    const handler = () => {
      if (!user || document.visibilityState !== "visible") return;
      fetchLeagues();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user, fetchLeagues]);

  const handleDeleteLeague = async (id: string) => {
    if (!confirm('Are you sure you want to delete this league?')) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/sim-leagues/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Failed to delete league");
      setLeagues(leagues.filter((league: SimLeague) => league.id !== id));
      toast({
        title: "Success",
        description: "League deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete league";
      console.error('Error deleting league:', error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const router=useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-between px-4 relative top-3">
            <div className="flex items-center space-x-2 gap-1">
              <Button variant="outline" size="icon" onClick={()=>router.push('/vendor/simracing-management' as any)} aria-label="Back">
                   <ArrowLeft className="h-4 w-4" />
              </Button>
        <p>back</p>
      </div>
    </div>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sim Racing League Management</h1>
              <p className="text-gray-600 mt-2">Organize and manage sim racing leagues</p>
            </div>
            <NextLink href={"/vendor/simleague/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </Button>
            </NextLink>
          </div>
        </div>

        <Tabs defaultValue="leagues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="leagues">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Your Leagues ({leagues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading leagues...</p>
                  </div>
                ) : leagues.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Leagues Yet</h3>
                    <p className="text-gray-600 mb-4">Start by creating your first sim racing league</p>
                    <NextLink href={"/vendor/simleague/create" as any}>
                      <Button>Create Your First League</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {leagues.map((league: SimLeague) => (
                        <div key={league.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg truncate">{league.name}</h3>
                            <div className="flex gap-1">
                              <NextLink href={`/vendor/simleague/edit/${league.id}` as any}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </NextLink>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteLeague(league.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{league.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>Platform: {league.platform}</span>
                            <span>Type: {league.registration_type}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{league.start_date ? new Date(league.start_date).toLocaleDateString() : 'N/A'}</span>
                            <span>Max: {league.max_participants || 'Unlimited'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  League Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Participant management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  League Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Standings management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default SimLeagueManagement;

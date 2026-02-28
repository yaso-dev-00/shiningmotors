"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flag, Plus, Edit, Trash2, Users, Trophy, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NextLink from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Back from './Back';
import type { SimEvent } from '@/integrations/supabase/modules/simRacing';

const SimEventManagement = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [simEvents, setSimEvents] = useState<SimEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSimEvents = useCallback(async () => {
    if (!user) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/sim-events?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { setSimEvents([]); return; }
        throw new Error(body?.error || "Failed to fetch sim events");
      }
      const body = await res.json();
      setSimEvents((body?.data || []) as SimEvent[]);
    } catch (error: unknown) {
      console.error('Error fetching sim events:', error);
      toast({ title: "Error", description: "Failed to load sim racing events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, session?.access_token, toast]);

  useEffect(() => {
    fetchSimEvents();
  }, [fetchSimEvents]);

  useEffect(() => {
    if (!pathname?.includes("/vendor/simevent-management")) return;
    fetchSimEvents();
  }, [pathname, fetchSimEvents]);

  useEffect(() => {
    const handler = () => {
      if (!user || document.visibilityState !== "visible") return;
      fetchSimEvents();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user, fetchSimEvents]);

  const handleDeleteSimEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sim event?')) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/sim-events/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Failed to delete sim event");
      setSimEvents(simEvents.filter((event: SimEvent) => event.id !== id));
      toast({
        title: "Success",
        description: "Sim event deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete sim event";
      console.error('Error deleting sim event:', error);
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
              <Button variant="outline" size="icon" onClick={()=>router.push(`/vendor/simracing-management` as any)} aria-label="Back">
                   <ArrowLeft className="h-4 w-4" />
              </Button>
        <p>back</p>
      </div>
    </div>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sim Event Management</h1>
              <p className="text-gray-600 mt-2">Organize and manage sim racing events</p>
            </div>
            <NextLink href={"/vendor/simevent/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </NextLink>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flag className="w-5 h-5 mr-2" />
                  Your Sim Events ({simEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading sim events...</p>
                  </div>
                ) : simEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Sim Events Yet</h3>
                    <p className="text-gray-600 mb-4">Start by creating your first sim racing event</p>
                    <NextLink href={"/vendor/simevent/create" as any}>
                      <Button>Create Your First Event</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {simEvents.map((event: SimEvent) => (
                        <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                            <div className="flex gap-1">
                              <NextLink href={`/vendor/simevent/edit/${event.id}` as any}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </NextLink>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSimEvent(event.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                          <div className="space-y-1 text-sm text-gray-500">
                            <p>Type: {event.event_type}</p>
                            <p>Platform: {event.platform}</p>
                            <p>Track: {event.track}</p>
                            <p>Class: {event.car_class}</p>
                            <p>Registration: {event.registration_type}</p>
                            <p>Max Participants: {event.max_participants || 'Unlimited'}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                            <span>{event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}</span>
                            <span>{event.format}</span>
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
                  Event Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Participant management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Event Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Results management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default SimEventManagement;

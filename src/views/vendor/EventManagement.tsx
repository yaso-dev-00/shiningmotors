"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Edit, Trash2, Users, DollarSign, BarChart3, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NextLink from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EventAnalytics } from '@/integrations/supabase/modules/vendorAnalytics';
import { type Event } from '@/integrations/supabase/modules/events';
import EventRegistrationAnalytics from '@/components/vendor/EventRegistrationAnalytics';
import Back from './Back';

const EventManagement = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/events?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { setEvents([]); return; }
        throw new Error(body?.error || "Failed to fetch events");
      }
      const body = await res.json();
      setEvents((body?.data || []) as Event[]);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, session?.access_token, toast]);

  const fetchEventAnalytics = useCallback(async () => {
    if (!user) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/events/analytics?_t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      });
      if (!res.ok) { setEventAnalytics(null); return; }
      const body = await res.json();
      setEventAnalytics(body?.data ?? null);
    } catch (error) {
      console.error('Error fetching event analytics:', error);
      setEventAnalytics(null);
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchEventAnalytics();
    }
  }, [user, fetchEvents, fetchEventAnalytics]);

  useEffect(() => {
    if (!pathname?.includes("/vendor/event-management")) return;
    fetchEvents();
  }, [pathname, fetchEvents]);

  useEffect(() => {
    const handler = () => {
      if (!user || document.visibilityState !== "visible") return;
      fetchEvents();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user, fetchEvents]);

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    try {
      const res = await fetch(`/api/vendor/events/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Failed to delete event");
      setEvents(events.filter(event => event.id !== id));
      await fetchEventAnalytics(); // Refresh analytics after deletion
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete event";
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  const router=useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-between px-4 relative top-3">
            <div className="flex items-center space-x-2 gap-1">
              <Button variant="outline" size="icon" onClick={() => router.push("/vendor-dashboard")} aria-label="Back">
                   <ArrowLeft className="h-4 w-4" />
              </Button>
        <p>back</p>
      </div>
    </div>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Event Management</h1>
              <p className="text-gray-600 mt-2">Organize and manage your events</p>
            </div>
            <NextLink href={"/vendor/event/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </NextLink>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader className='max-[769px]:p-4'>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Your Events ({events.length})
                </CardTitle>
              </CardHeader>
              <CardContent className='max-[769px]:p-4'>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                    <p className="text-gray-600 mb-4">Start by creating your first event</p>
                    <NextLink href={"/vendor/event/create" as any}>
                      <Button>Create Your First Event</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {events.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                            <div className="flex gap-1">
                              <NextLink href={`/vendor/event/edit/${event.id}` as any}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </NextLink>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {event.banner_image_url && (
                            <img 
                              src={event.banner_image_url} 
                              alt={event.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-gray-600 text-sm mb-2">{event.category}</p>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{event.start_date}</span>
                            <span className="capitalize">{event.status}</span>
                          </div>
                          {event.fee_amount && (
                            <p className="text-lg font-bold text-green-600 mt-2">
                              {event.fee_currency} {event.fee_amount}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations">
            <Card>
              <CardHeader className='max-[769px]:p-4'>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Registration Overview
                </CardTitle>
              </CardHeader >
              <CardContent className='max-[769px]:p-4'>
                {eventAnalytics ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <Users className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                      <div className="text-3xl font-bold text-blue-600">{eventAnalytics.totalRegistrations}</div>
                      <div className="text-sm text-gray-600">Total Registrations</div>
                    </div>
                    
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <DollarSign className="w-12 h-12 mx-auto text-green-600 mb-2" />
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(eventAnalytics.totalRevenue)}</div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    
                    <div className="text-center p-6 bg-purple-50 rounded-lg">
                      <BarChart3 className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                      <div className="text-3xl font-bold text-purple-600">{formatCurrency(eventAnalytics.avgRegistrationFee)}</div>
                      <div className="text-sm text-gray-600">Avg Registration Fee</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Registration Data</h3>
                    <p className="text-gray-600">Registration data will appear here once users start registering for your events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader className='max-[769px]:p-4'>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Event Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className='max-[769px]:p-4'>
                <EventRegistrationAnalytics 
                  eventAnalytics={eventAnalytics} 
                  formatCurrency={formatCurrency}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader className='max-[769px]:p-4'>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Comprehensive Registration Insights
                </CardTitle>
              </CardHeader>
              <CardContent className='max-[769px]:p-4'>
                {eventAnalytics ? (
                  <div className="space-y-6">
                    {/* Recent Registrations */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Registrations</h3>
                      <div className="space-y-3">
                        {eventAnalytics.recentRegistrations?.slice(0, 5).map((registration, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <div className="font-semibold">{registration.participant_name}</div>
                              <div className="text-sm text-gray-600">{registration.event_title}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                {registration.payment_amount > 0 ? formatCurrency(registration.payment_amount) : 'Free'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(registration.registration_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category Performance */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventAnalytics.categoryPerformance?.map((category, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="font-semibold">{category.category}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {category.events} events • {category.registrations} registrations
                            </div>
                            <div className="text-green-600 font-bold mt-2">
                              {formatCurrency(category.revenue)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                    <p className="text-gray-600">Detailed insights will be available once you have event registrations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default EventManagement;


import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserEventRegistrations } from '@/integrations/supabase/modules/eventAppPage';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import NextLink from "next/link";
import { formatDistanceToNow } from 'date-fns';
import Layout from '../Layout';
import { useAuth } from '@/contexts/AuthContext';

interface EventRegistrationsHistoryProps {
  userId: string;
}

export const EventRegistrationsHistory: React.FC<EventRegistrationsHistoryProps> = ({ userId }) => {

    const { user } = useAuth();
    const { data: registrations, isLoading } = useQuery({
      queryKey: ['userEventRegistrations', user?.id],
      queryFn: () => getUserEventRegistrations(user!.id),
      enabled: !!user?.id,
    });

  if (isLoading) {
    return (
      <Layout>
      <div className="p-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
      </div>
      </Layout>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Event Registrations</CardTitle>
          <CardDescription>You haven't registered for any events yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center p-4 md:py-6">
          <Ticket className="w-12 h-12 mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-500 mb-4">Browse our events and register to see them here</p>
          <Button asChild className="bg-red-600 hover:bg-red-700">
            <NextLink href="/events">Explore Events</NextLink>
          </Button>
        </CardContent>
      </Card>
      </Layout>
    );
  }

  return (

        <Layout>
          <div className="container mx-auto py-10">
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center">
        <Ticket className="mr-2 h-5 w-5" /> Your Event Registrations
      </h3>
      
      <div className="grid gap-4">
        {registrations.map((registration: any) => (
          <Card key={registration.id} className="overflow-hidden">
            <div className="md:flex">
              {/* Event Image */}
              {registration.event.banner_image_url && (
                <div className="md:w-1/3 h-32 md:h-auto">
                  <img
                    src={registration.event.banner_image_url}
                    alt={registration.event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Event Details */}
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-red-600 mb-2">{registration.event.category}</Badge>
                    <h4 className="font-semibold text-lg">{registration.event.title}</h4>
                  </div>
                  
                  {/* Registration Status */}
                  <div className="text-sm">
                    {registration.status === 'confirmed' ? (
                      <Badge variant="outline" className="border-green-500 text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmed
                      </Badge>
                    ) : registration.status === 'cancelled' ? (
                      <Badge variant="outline" className="border-red-500 text-red-600 flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {registration.status}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Event Details */}
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      {new Date(registration.event.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{registration.event.venue || "Venue TBA"}</span>
                  </div>
                </div>
                
                {/* Payment Status */}
                {registration.payment_amount > 0 && (
                  <div className="mt-3 text-sm flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-2">Payment: </span>
                    {registration.payment_status === 'completed' ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        Paid {registration.payment_currency} {registration.payment_amount}
                      </Badge>
                    ) : registration.payment_status === 'pending' ? (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        Payment pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300">
                        {registration.payment_status}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <CardFooter className="bg-gray-50 p-4 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Registered {formatDistanceToNow(new Date(registration.created_at), { addSuffix: true })}
              </div>
              <div className="space-x-2">
                {registration.payment_status === 'pending' && registration.payment_amount > 0 && (
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Complete Payment
                  </Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <NextLink href={`/events/${registration.event.id}`}>View Event</NextLink>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
    </div>
    </Layout>
  );
};

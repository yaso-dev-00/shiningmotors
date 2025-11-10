"use client";
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Calendar,
  Share2,
  Star,
  Clock,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SimRacingGarageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('services');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  interface GarageService {
    id: string;
    title: string;
    description?: string | null;
    service_type?: string | null;
    available_online?: boolean | null;
    duration?: string | null;
    price?: number | null;
    booking_link?: string | null;
  }

  const [selectedService, setSelectedService] = useState<GarageService | null>(null);
  const { user } = useAuth();

  // Fetch garage details
  const { data: garage, isLoading } = useQuery({
    queryKey: ['garageDetail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await simAppApi.garages.getGarageDetails(id);
      if (error) {
        console.error("Error fetching garage details:", error);
        return null;
      }
      return data;
    },
    enabled: !!id && typeof window !== 'undefined',
  });

  // Booking form state
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedService) {
      toast({
        title: "Error",
        description: "You need to be logged in to book a service",
        variant: "destructive"
      });
      return;
    }

    try {
      const bookingData = {
        booking_date: `${formData.date}T${formData.time}:00`,
        notes: formData.notes
      };

      const { error } = await simAppApi.garages.bookService(
        user.id, 
        selectedService.id, 
        bookingData
      );

      if (error) throw error;

      toast({
        title: "Booking Successful",
        description: `You have booked ${selectedService.title}`,
      });
      
      setBookingDialogOpen(false);
      setFormData({ date: '', time: '', notes: '' });
    } catch (error: unknown) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!garage) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Service Provider Not Found</h1>
            <p className="text-gray-500 mb-8">This garage may have been removed or doesn't exist.</p>
            <NextLink href="/sim-racing/services">
              <Button>Back to Services</Button>
            </NextLink>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Garage Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden">
                {garage.logo ? (
                  <img 
                    src={garage.logo} 
                    alt={garage.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <Settings className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{garage.name}</h1>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  {garage.city && garage.country && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{garage.city}, {garage.country}</span>
                    </div>
                  )}
                  {garage.ratings && (
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>{(garage.ratings as { average?: number; count?: number })?.average || '4.5'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {garage.phone && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <a href={`tel:${garage.phone}`} className="font-semibold hover:underline">
                    {garage.phone}
                  </a>
                </div>
              </div>
            )}
            {garage.email && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <a href={`mailto:${garage.email}`} className="font-semibold hover:underline">
                    {garage.email}
                  </a>
                </div>
              </div>
            )}
            {garage.website && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                  <a href={garage.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                    Visit Website
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-8">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {garage.services && garage.services.length > 0 ? (
                garage.services.map((service: GarageService) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>{service.title}</CardTitle>
                        <CardDescription>
                          {service.service_type && (
                            <Badge variant="outline" className="mr-2">
                              {service.service_type}
                            </Badge>
                          )}
                          {service.available_online && (
                            <Badge variant="secondary">Available Online</Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {service.description || "No description provided."}
                        </p>
                        {service.duration && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Clock className="h-4 w-4" />
                            <span>Duration: {service.duration}</span>
                          </div>
                        )}
                        {service.price && (
                          <p className="text-xl font-semibold">${service.price.toFixed(2)}</p>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (service.booking_link) {
                              window.open(service.booking_link, '_blank');
                            }
                          }}
                          disabled={!service.booking_link}
                        >
                          Learn More
                        </Button>
                        <Button onClick={() => {
                          setSelectedService(service);
                          setBookingDialogOpen(true);
                        }}>
                          Book Now
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No services available from this provider.
                </div>
              )}
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-4">About {garage.name}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {garage.name} is a professional sim racing service provider offering a range of services
                  to help sim racers improve their skills and optimize their setups.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {garage.services_offered ? (
                    garage.services_offered.map((service: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{service}</Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">Services information not available.</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                {garage.city && garage.country ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {garage.city}, {garage.state && `${garage.state}, `}{garage.country}
                    </p>
                    <div className="relative h-40 rounded-md overflow-hidden bg-gray-100">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Map preview
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Location details not available.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Customer Reviews</h2>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-semibold">
                    {(garage.ratings as { average?: number; count?: number })?.average || '4.5'}
                  </span>
                  <span className="text-gray-500">
                    ({(garage.ratings as { average?: number; count?: number })?.count || '24'} reviews)
                  </span>
                </div>
              </div>

              <div className="text-center py-12 text-gray-500">
                Review section coming soon.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book {selectedService?.title}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleBookService} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="date" className="block text-sm font-medium">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="time" className="block text-sm font-medium">
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any specific requirements or questions?"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.date || !formData.time}>
                  Book Service
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SimRacingGarageDetail;

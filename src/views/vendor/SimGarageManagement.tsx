"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Plus, Edit, Trash2, Settings, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NextLink from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Back from './Back';
import { Database } from '@/integrations/supabase/types';

type SimGarage = Database['public']['Tables']['sim_garages']['Row'];
type GarageWithServices = SimGarage & {
  services?: Array<{ count: number }>;
};

const SimGarageManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [garages, setGarages] = useState<GarageWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGarages();
  }, [user]);

  const fetchGarages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sim_garages')
        .select(`
          *,
          services:sim_garage_services(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setGarages((data || []) as GarageWithServices[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load sim garages";
      console.error('Error fetching garages:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGarage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this garage?')) return;
    
    try {
      const { error } = await supabase
        .from('sim_garages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setGarages(garages.filter((garage: GarageWithServices) => garage.id !== id));
      toast({
        title: "Success",
        description: "Garage deleted successfully",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete garage";
      console.error('Error deleting garage:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Back />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sim Garage Management</h1>
              <p className="text-gray-600 mt-2">Manage sim racing garages and services</p>
            </div>
            <NextLink href={"/vendor/simgarage/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Garage
              </Button>
            </NextLink>
          </div>
        </div>

        <Tabs defaultValue="garages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="garages">Garages</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="garages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Your Garages ({garages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading garages...</p>
                  </div>
                ) : garages.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Garages Yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first sim garage</p>
                    <NextLink href={"/vendor/simgarage/create" as any}>
                      <Button>Add Your First Garage</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {garages.map((garage: GarageWithServices) => (
                        <div key={garage.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg truncate">{garage.name}</h3>
                            <div className="flex gap-1">
                              <NextLink href={`/vendor/simgarage/edit/${garage.id}` as any}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </NextLink>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteGarage(garage.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {garage.logo && (
                            <img 
                              src={garage.logo} 
                              alt={garage.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>{garage.city}, {garage.state}</p>
                            <p>{garage.email}</p>
                            <p>{garage.phone}</p>
                            <p>Services: {(garage.services && Array.isArray(garage.services) && garage.services.length > 0) ? (garage.services[0] as { count: number }).count : 0}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Garage Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Service management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Service Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Booking management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default SimGarageManagement;

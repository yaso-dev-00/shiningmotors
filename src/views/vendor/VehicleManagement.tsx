"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NextLink from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { vehiclesApi, ExtendedVehicle } from '@/integrations/supabase/modules/vehicles';
import { useToast } from '@/hooks/use-toast';
import Back from './Back';

const VehicleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await vehiclesApi.vehicles.getBySeller(user.id);
      
      if (error) throw error;
      
      // Transform data to match ExtendedVehicle type
      const transformedVehicles: ExtendedVehicle[] = (data || []).map((vehicle) => ({
        ...vehicle,
        fuel_type: vehicle.fuel_type || '',
        status: vehicle.status || 'Available',
      }));
      
      setVehicles(transformedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      const { error } = await vehiclesApi.vehicles.delete(id);
      
      if (error) throw error;
      
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      
      // Trigger revalidation for vehicles SSG/ISR
      try {
        await fetch("/api/vehicles/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: id,
            action: "delete",
          }),
        });
      } catch (revalidateError) {
        console.error("Error triggering vehicles revalidation:", revalidateError);
      }
      
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle",
        variant: "destructive",
      });
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      <Header /> 
      <Back></Back>
      <main className="container mx-auto px-4 py-8">
        
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col gap-y-2 md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Vehicle Management</h1>
              <p className="text-gray-600 mt-2">Manage your vehicle listings</p>
            </div>
            <NextLink href={"/vendor/vehicle/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </NextLink>
          </div>
        </div>

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">Vehicle Listings</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  Your Vehicles ({vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading vehicles...</p>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Vehicles Listed</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first vehicle listing</p>
                    <NextLink href={"/vendor/vehicle/create" as any}>
                      <Button>List Your First Vehicle</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg truncate">{vehicle.title}</h3>
                            <div className="flex gap-1">
                              <NextLink href={`/vendor/vehicles/edit/${vehicle.id}` as any}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </NextLink>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {vehicle.images && vehicle.images.length > 0 && (
                            <img 
                              src={vehicle.images[0]} 
                              alt={vehicle.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <p className="text-gray-600 text-sm mb-2">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                          <p className="text-xl font-bold text-green-600">${vehicle.price}</p>
                          <p className="text-sm text-gray-500">Category: {vehicle.category}</p>
                          <p className="text-sm text-gray-500">Status: {vehicle.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle>Customer Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Inquiry management features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Analytics dashboard coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default VehicleManagement;

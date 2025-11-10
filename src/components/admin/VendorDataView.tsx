
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { vendorActivitiesApi } from '@/integrations/supabase/modules/vendorActivities';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Car, Wrench, Calendar, Trophy, Eye } from 'lucide-react';
import NextLink from "next/link";

interface VendorDataViewProps {
  vendorId: string;
  vendorName: string;
}

type VendorCollections = {
  products: any[];
  vehicles: any[];
  services: any[];
  events: any[];
  simProducts: any[];
  simEvents: any[];
  simLeagues: any[];
  simGarages: any[];
};

const VendorDataView: React.FC<VendorDataViewProps> = ({ vendorId, vendorName }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<VendorCollections>({
    products: [],
    vehicles: [],
    services: [],
    events: [],
    simProducts: [],
    simEvents: [],
    simLeagues: [],
    simGarages: []
  });

  useEffect(() => {
    fetchVendorData();
  }, [vendorId]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const data = await vendorActivitiesApi.getVendorDataByUserId(vendorId);
      setVendorData(data as VendorCollections);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{vendorName} - Data Overview</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-xl font-bold">{vendorData.products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Vehicles</p>
                <p className="text-xl font-bold">{vendorData.vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Services</p>
                <p className="text-xl font-bold">{vendorData.services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Events</p>
                <p className="text-xl font-bold">{vendorData.events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className='w-full'>
          <div className='w-full flex md:grid grid-flow-col overflow-x-scroll scrollbar-hide'>
          <TabsTrigger value="products">Products ({vendorData.products.length})</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vendorData.vehicles.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({vendorData.services.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({vendorData.events.length})</TabsTrigger>
          <TabsTrigger value="simracing">Sim Racing</TabsTrigger>
          </div>
        </TabsList>


        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorData.products.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No products found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData.products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>{product.inventory}</TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(product.created_at)}</TableCell>
                        <TableCell>
                          <NextLink href={`/shop/product/${product.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </NextLink>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorData.vehicles.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No vehicles found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData.vehicles.map((vehicle: any) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.title}</TableCell>
                        <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>{formatPrice(vehicle.price)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vehicle.condition}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vehicle.status === 'Available' ? 'default' : 'secondary'}>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <NextLink href={`/vehicles/${vehicle.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </NextLink>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorData.services.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No services found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData.services.map((service: any) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category}</Badge>
                        </TableCell>
                        <TableCell>{service.price}</TableCell>
                        <TableCell>{service.duration}</TableCell>
                        <TableCell>{service.location}</TableCell>
                        <TableCell>
                          <NextLink href={`/services/${service.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </NextLink>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              {vendorData.events.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No events found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData.events.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.category}</Badge>
                        </TableCell>
                        <TableCell>{event.start_date ? formatDate(event.start_date) : 'TBD'}</TableCell>
                        <TableCell>{event.city}, {event.state}</TableCell>
                        <TableCell>
                          {event.fee_amount ? formatPrice(event.fee_amount) : 'Free'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <NextLink href={`/events/${event.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </NextLink>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simracing">
          <div className="space-y-6">
            {/* Sim Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Sim Racing Products ({vendorData.simProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendorData.simProducts.length === 0 ? (
                  <p className="text-center text-gray-600 py-4">No sim racing products found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorData.simProducts.slice(0, 5).map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <NextLink href={`/sim-racing/products/${product.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </NextLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Sim Events */}
            <Card>
              <CardHeader>
                <CardTitle>Sim Racing Events ({vendorData.simEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {vendorData.simEvents.length === 0 ? (
                  <p className="text-center text-gray-600 py-4">No sim racing events found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Max Participants</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorData.simEvents.map((event: any) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.platform}</Badge>
                          </TableCell>
                          <TableCell>{event.start_date ? formatDate(event.start_date) : 'TBD'}</TableCell>
                          <TableCell>{event.max_participants || 'Unlimited'}</TableCell>
                          <TableCell>
                            <NextLink href={`/sim-racing/events/${event.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </NextLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDataView;

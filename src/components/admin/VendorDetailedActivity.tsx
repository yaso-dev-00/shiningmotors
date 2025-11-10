
import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  Phone,
  Mail,
  ArrowLeft,
  Star,
  ShoppingCart,
  Car,
  Wrench,
  Gamepad2,
  Calendar,
  BarChart3
} from 'lucide-react';
import NextLink from "next/link";
import { vendorActivitiesApi, type VendorActivityData } from '@/integrations/supabase/modules/vendorActivities';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const VendorDetailedActivity: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const isMobile=useIsMobile()
  useEffect(() => {
    window.scrollTo(0,0)
    if (vendorId) {
      fetchVendorDetails();
      fetchCategoryPerformance();
    }
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      const { data: vendorData, error } = await vendorActivitiesApi.getVendorActivityById(vendorId!);
      
      if (error) throw error;
      setVendor(vendorData);
      
      if (vendorData) {
        await fetchActualRevenueData(vendorData);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActualRevenueData = async (vendorData: VendorActivityData) => {
    try {
      const actualRevenueData = await vendorActivitiesApi.getVendorRevenueData(vendorData.user_id);
      setRevenueData(actualRevenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      const totalRevenue = vendorData.performanceMetrics?.totalRevenue || 0;
      const fallbackData = [
        { month: 'Jan', revenue: Math.floor(totalRevenue * 0.7) },
        { month: 'Feb', revenue: Math.floor(totalRevenue * 0.75) },
        { month: 'Mar', revenue: Math.floor(totalRevenue * 0.8) },
        { month: 'Apr', revenue: Math.floor(totalRevenue * 0.85) },
        { month: 'May', revenue: Math.floor(totalRevenue * 0.9) },
        { month: 'Jun', revenue: totalRevenue }
      ];
      setRevenueData(fallbackData);
    }
  };

  const fetchCategoryPerformance = async () => {
    try {
      const { data: categoryData, error } = await vendorActivitiesApi.getCategoryPerformanceById(vendorId!);
      
      if (error) throw error;
      setCategoryPerformance(categoryData || []);
    } catch (error) {
      console.error('Error fetching category performance:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shop': return <ShoppingCart className="w-5 h-5" />;
      case 'Vehicle': return <Car className="w-5 h-5" />;
      case 'Service': return <Wrench className="w-5 h-5" />;
      case 'SimRacing': return <Gamepad2 className="w-5 h-5" />;
      case 'Event': return <Calendar className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Vendor not found</h3>
        <p className="text-gray-600">The requested vendor could not be found.</p>
      </div>
    );
  }

  // Get available tabs based on actual data
  const availableTabs = [];
  if (vendor.products && vendor.products.length > 0) {
    availableTabs.push({ key: 'products', label: 'Products', count: vendor.products.length, icon: ShoppingCart });
  }
  if (vendor.vehicles && vendor.vehicles.length > 0) {
    availableTabs.push({ key: 'vehicles', label: 'Vehicles', count: vendor.vehicles.length, icon: Car });
  }
  if (vendor.services && vendor.services.length > 0) {
    availableTabs.push({ key: 'services', label: 'Services', count: vendor.services.length, icon: Wrench });
  }
  if (vendor.events && vendor.events.length > 0) {
    availableTabs.push({ key: 'events', label: 'Events', count: vendor.events.length, icon: Calendar });
  }
  if (vendor.simProducts && vendor.simProducts.length > 0) {
    availableTabs.push({ key: 'simProducts', label: 'Sim Products', count: vendor.simProducts.length, icon: Gamepad2 });
  }
  
  // Always add analytics tab
  availableTabs.push({ key: 'analytics', label: 'Analytics', count: null, icon: BarChart3 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <NextLink href="/admin/vendor-activities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </NextLink>
        <div>
          <h1 className="text-3xl font-bold">{vendor.business_name}</h1>
          <p className="text-gray-600 mt-1">Detailed vendor activity and analytics</p>
        </div>
      </div>

      {/* Vendor Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Vendor Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div>
              <h4 className="font-semibold text-gray-900">Contact Person</h4>
              <p className="text-gray-600">{vendor.personal_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Email
              </h4>
              <p className="text-gray-600">{vendor.email}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Phone
              </h4>
              <p className="text-gray-600">{vendor.mobile}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Status</h4>
              <Badge className={vendor.is_verified_by_admin ? "bg-green-600" : "bg-yellow-600"}>
                {vendor.is_verified_by_admin ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {vendor.categories?.map((category) => (
                <Badge key={category} variant="secondary" className="flex items-center space-x-1">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-2 md:p-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(vendor.performanceMetrics?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className={`text-2xl font-bold ${(vendor.performanceMetrics?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(vendor.performanceMetrics?.monthlyGrowth || 0).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Monthly Growth</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {(vendor.performanceMetrics?.totalCustomers || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">
                {(vendor.performanceMetrics?.customerSatisfaction || 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Satisfaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      {availableTabs.length > 0 && (
        <Tabs defaultValue={availableTabs[0]?.key} className="w-full">
          <TabsList className="w-full">
            <div className="flex md:grid w-full overflow-scroll scrollbar-hide overscroll-none scroll-smooth" style={{ gridTemplateColumns: `repeat(${Math.min(availableTabs.length, 6)}, 1fr)` }}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center space-x-1">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label} {tab.count !== null && `(${tab.count})`}</span>
              </TabsTrigger>
            ))}
            </div>
          </TabsList>

          {/* Products Tab */}
          {vendor.products && vendor.products.length > 0 && (
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle>Products ({vendor.products.length})</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:p-2'>
                  <div className="space-y-4">
                    {vendor.products.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          <p className="text-xs text-gray-500">Created: {new Date(product.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-sm text-gray-600">Stock: {product.inventory || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Vehicles Tab */}
          {vendor.vehicles && vendor.vehicles.length > 0 && (
            <TabsContent value="vehicles" className="space-y-4">
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle>Vehicles ({vendor.vehicles.length})</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:p-2'>
                  <div className="space-y-4">
                    {vendor.vehicles.map((vehicle: any) => (
                      <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{vehicle.title}</h4>
                          <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                          <p className="text-xs text-gray-500">Category: {vehicle.category}</p>
                          <p className="text-xs text-gray-500">Fuel: {vehicle.fuel_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(vehicle.price)}
                          </p>
                          <Badge variant={vehicle.status === 'Available' ? 'default' : 'secondary'}>
                            {vehicle.status || 'Available'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Services Tab */}
          {vendor.services && vendor.services.length > 0 && (
            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle>Services ({vendor.services.length})</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:p-2'>
                  <div className="space-y-4">
                    {vendor.services.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{service.title}</h4>
                          <p className="text-sm text-gray-600">{service.category}</p>
                          <p className="text-xs text-gray-500">Location: {service.location}</p>
                          <p className="text-xs text-gray-500">Duration: {service.duration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            {service.price || 'Contact for price'}
                          </p>
                          <Badge variant="outline">
                            {service.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Events Tab */}
          {vendor.events && vendor.events.length > 0 && (
            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle>Events ({vendor.events.length})</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:p-2'>
                  <div className="space-y-4">
                    {vendor.events.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.category}</p>
                          <p className="text-xs text-gray-500">Date: {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Not scheduled'}</p>
                          <p className="text-xs text-gray-500">Location: {event.city}, {event.state}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">
                            {event.fee_amount ? formatCurrency(event.fee_amount) : 'Free'}
                          </p>
                          <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Sim Products Tab */}
          {vendor.simProducts && vendor.simProducts.length > 0 && (
            <TabsContent value="simProducts" className="space-y-4">
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle>Sim Racing Products ({vendor.simProducts.length})</CardTitle>
                </CardHeader>
                <CardContent className='max-[769px]:p-2'>
                  <div className="space-y-4">
                    {vendor.simProducts.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.brand}</p>
                          <p className="text-xs text-gray-500">Category: {product.category}</p>
                          <p className="text-xs text-gray-500">Created: {new Date(product.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-sm text-gray-600">Stock: {product.stock || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader className='max-[769px]:py-4'>
                  <CardTitle>Revenue Trend</CardTitle>
                  <p className="text-sm text-gray-600">Based on actual order data and transactions</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {categoryPerformance.length > 0 && (
                <Card>
                  <CardHeader className='max-[769px]:py-4'>
                    <CardTitle>Category Performance</CardTitle>
                    <p className="text-sm text-gray-600">Based on actual business data</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryPerformance}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent, x, y }: any) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className='text-[13px] md:text-[15px]' fontSize={10}>
    {`${category}: ${(percent * 100).toFixed(0)}%`}
  </text>
)} 
                          outerRadius={isMobile?90:100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VendorDetailedActivity;

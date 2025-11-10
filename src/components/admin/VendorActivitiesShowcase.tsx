"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  Eye,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import NextLink from 'next/link';
import { vendorActivitiesApi, type VendorActivityData } from '@/integrations/supabase/modules/vendorActivities';
import { useToast } from '@/hooks/use-toast';

const VendorActivitiesShowcase: React.FC = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorActivityData[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<VendorActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(()=>{
     window.scrollTo(0,0) 
  },[])
  useEffect(() => {
    fetchVendorActivities();
  }, []);

  useEffect(() => {
    filterAndSortVendors();
  }, [vendors, searchQuery, categoryFilter, sortBy]);

  const fetchVendorActivities = async () => {
    try {
      setLoading(true);
      const { data: vendorData, error } = await vendorActivitiesApi.getAllVendorsWithActivities();
      
      if (error) throw error;
      setVendors(vendorData || []);
    } catch (error) {
      console.error('Error fetching vendor activities:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVendors = () => {
    let filtered = vendors.filter(vendor => {
      const matchesSearch = 
        vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.personal_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
        vendor.categories?.includes(categoryFilter);

      return matchesSearch && matchesCategory;
    });

    // Sort vendors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return (b.performanceMetrics?.totalRevenue || 0) - (a.performanceMetrics?.totalRevenue || 0);
        case 'growth':
          return (b.performanceMetrics?.monthlyGrowth || 0) - (a.performanceMetrics?.monthlyGrowth || 0);
        case 'products':
          return (b.products?.length || 0) - (a.products?.length || 0);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredVendors(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-3xl font-bold">Vendor Activities</h1> */}
          <p className="text-gray-600 mt-2">Monitor vendor performance and business metrics</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search vendors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Shop">Shop</SelectItem>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="SimRacing">Sim Racing</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="date">Join Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-3xl font-bold">{vendors.length}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(vendors.reduce((sum, v) => sum + (v.performanceMetrics?.totalRevenue || 0), 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-3xl font-bold">
                  {vendors.filter(v => v.is_verified_by_admin).length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold">
                  {vendors.reduce((sum, v) => sum + (v.products?.length || 0), 0)}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-2 md:p-6">
              <div className="flex flex-col gap-y-3 md:flex-row items-start justify-between mb-4">
                <div className="flex items-center space-x-3 gap-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div className='flex flex-col md:flex-row gap-2 items-baseline'>
                    <h3 className="text-lg font-semibold">
                      {vendor.business_name || vendor.personal_name}
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-start items-center space-x-2">
                      {vendor.categories?.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end">
                  <NextLink href={`/admin/vendor-activities/${vendor.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </NextLink>
                  {vendor.is_verified_by_admin ? (
                    <Badge className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(vendor.performanceMetrics?.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <p className={`text-2xl font-bold ${(vendor.performanceMetrics?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(vendor.performanceMetrics?.monthlyGrowth || 0).toFixed(1)}%
                    </p>
                    {getGrowthIcon(vendor.performanceMetrics?.monthlyGrowth || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Growth</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {vendor.products?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Products</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {vendor.services?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Services</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {vendor.events?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Events</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {vendor.vehicles?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Vehicles</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">
                      {(vendor.performanceMetrics?.conversionRate || 0).toFixed(1)}%
                    </p>
                    <p className="text-gray-600">Conversion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">
                      {(vendor.performanceMetrics?.customerSatisfaction || 0).toFixed(1)}/5
                    </p>
                    <p className="text-gray-600">Satisfaction</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-purple-600">
                      {(vendor.performanceMetrics?.responseTime || 0).toFixed(1)}h
                    </p>
                    <p className="text-gray-600">Response Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorActivitiesShowcase;

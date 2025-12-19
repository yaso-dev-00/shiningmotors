"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { vendorApi } from '@/integrations/supabase/modules/vendors';
import { vendorAnalyticsApi, type ShopAnalytics, type VehicleAnalytics, type ServiceAnalytics } from '@/integrations/supabase/modules/vendorAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Eye,
  Star,
  Calendar,
  ShoppingCart,
  Activity,
  Target,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  ThumbsUp,
  Repeat,
  UserPlus
} from 'lucide-react';
import Back from './Back';
import { useIsMobile } from '@/hooks/use-mobile';

const VendorAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendorData, setVendorData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<{
    shop?: ShopAnalytics;
    vehicle?: VehicleAnalytics;
    service?: ServiceAnalytics;
  }>({});
  const [eventAnalytics, setEventAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const isMobile = useIsMobile()

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user, selectedPeriod]);

  const fetchVendorData = async () => {
    try {
      const { data: vendor, error } = await vendorApi.getByUserId(user!.id);
      if (error) throw error;
      setVendorData(vendor);

      if (vendor) {
        await Promise.all([
          fetchAnalytics(vendor),
          // fetchEventAnalytics()
        ]);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor data",
        variant: "destructive"
      });
    }
  };
  console.log(eventAnalytics)
  const fetchAnalytics = async (vendor: any) => {
    try {
      setLoading(true);
      const analyticsData: any = {};

      if (vendor.categories?.includes('Shop')) {
        const { data: shopData } = await vendorAnalyticsApi.getShopAnalytics(user!.id);
        if (shopData) analyticsData.shop = shopData;
      }

      if (vendor.categories?.includes('Vehicle')) {
        const { data: vehicleData } = await vendorAnalyticsApi.getVehicleAnalytics(user!.id);
        if (vehicleData) analyticsData.vehicle = vehicleData;
      }

      if (vendor.categories?.includes('Service')) {
        const { data: serviceData } = await vendorAnalyticsApi.getServiceAnalytics(user!.id);
        if (serviceData) analyticsData.service = serviceData;
      }
      if (vendor.categories?.includes('Event')) {
        const { data } = await vendorAnalyticsApi.getEventAnalytics(user!.id)
        if (data)
          setEventAnalytics(data)
      }

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const formatGrowthPercentage = (value: any) => {
    if (value === null || value === undefined || !isFinite(value)) {
      return '0%';
    }
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };
  const renderEventAnalytics = () => {
    if (!eventAnalytics) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Calculate event status breakdown
    const ongoingEvents = eventAnalytics.totalEvents - eventAnalytics.upcomingEvents - eventAnalytics.completedEvents;
    const eventStatusData = [
      { name: 'Ongoing', value: ongoingEvents, color: '#3b82f6' },
      { name: 'Upcoming', value: eventAnalytics.upcomingEvents, color: '#10b981' },
      { name: 'Completed', value: eventAnalytics.completedEvents, color: '#6b7280' }
    ].filter(item => item.value > 0);

    // Calculate growth metrics
    const currentMonthData = eventAnalytics.monthlyTrends[eventAnalytics.monthlyTrends.length - 1];
    const previousMonthData = eventAnalytics.monthlyTrends[eventAnalytics.monthlyTrends.length - 2];

    const getGrowth = (current: number, previous: number): number | string => {
      if (previous === 0) {
        if (current === 0) return 0;
        return 100;
      }
      return +(((current - previous) / previous) * 100).toFixed(1);
    };


    const registrationGrowth = getGrowth(
      currentMonthData?.registrations || 0,
      previousMonthData?.registrations || 0
    );

    const revenueGrowth = getGrowth(
      currentMonthData?.revenue || 0,
      previousMonthData?.revenue || 0
    );
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const pieRadius = isMobile ? 75 : 80; // 80 for mobile, 100 for larger screens
    console.log(eventAnalytics)
    const count = Object.values(eventAnalytics.registrationBreakdown).reduce((count: number, item: unknown) => count + (typeof item === 'number' ? item : 0), 0) as number
    return (
      <div className="space-y-6">
        {/* Enhanced Event Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-y-2 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventAnalytics.totalEvents}</div>
              <div className="flex gap-1 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {eventAnalytics.freeEvents} Free
                </Badge>
                <Badge variant="default" className="text-xs bg-green-600">
                  {eventAnalytics.paidEvents} Paid
                </Badge>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventAnalytics.totalRegistrations}</div>
              <div className={`text-xs mt-1 ${typeof registrationGrowth === 'number' && registrationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {typeof registrationGrowth === 'number'
                  ? `${registrationGrowth >= 0 ? '+' : ''}${registrationGrowth}%  growth`
                  : registrationGrowth}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(eventAnalytics.totalRevenue)}</div>
              <div className={`text-xs mt-1 ${typeof revenueGrowth === 'number' && revenueGrowth >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}>
                {typeof revenueGrowth === 'number'
                  ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% growth`
                  : revenueGrowth}
              </div>
            </CardContent>
          </Card>




          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ongoing Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{ongoingEvents}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{eventAnalytics.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground">
                Future events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Registration Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(eventAnalytics.avgRegistrationFee)}</div>
              <p className="text-xs text-muted-foreground">
                Per registration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registration & Revenue Analytics */}
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Breakdown */}
          {eventAnalytics?.registrationBreakdown && count > 0 &&
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Registration Breakdown
                </CardTitle>
                <CardDescription>Free vs Paid registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Free', value: eventAnalytics.registrationBreakdown.free, color: '#10b981' },
                        { name: 'Paid', value: eventAnalytics.registrationBreakdown.paid, color: '#3b82f6' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={pieRadius}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={(props: { name?: string; percent?: number; x?: number; y?: number }) => {
                        const { name = '', percent = 0, x = 0, y = 0 } = props;
                        return (
                          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className='text-[13px] md:text-[15px]' fontSize={10}>
                            {`${name}: ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {[
                        { name: 'Free', value: eventAnalytics.registrationBreakdown.free, color: '#10b981' },
                        { name: 'Paid', value: eventAnalytics.registrationBreakdown.paid, color: '#3b82f6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Free Events
                    </span>
                    <span className="font-semibold">{eventAnalytics.registrationBreakdown.free}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      Paid Events
                    </span>
                    <span className="font-semibold">{eventAnalytics.registrationBreakdown.paid}</span>
                  </div>
                </div>
              </CardContent>
            </Card>}

          {/* Event Status Distribution */}
          {eventStatusData.length ? <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Event Status Distribution
              </CardTitle>
              <CardDescription>Current status of all events</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={eventStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={pieRadius}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={(props: { name?: string; percent?: number; x?: number; y?: number }) => {
                      const { name = '', percent = 0, x = 0, y = 0 } = props;
                      return (
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className='text-[13px] md:text-[15px]' fontSize={10}>
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}                  >
                    {eventStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {eventStatusData.map((status, index) => (
                  <div key={status.name} className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      {status.name}
                    </span>
                    <span className="font-semibold">{status.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
            : <></>}

          {/* Registration Growth Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Growth Statistics
              </CardTitle>
              <CardDescription>Month-over-month growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Registration Growth</p>
                    <p className="text-xs text-muted-foreground">vs last month</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${typeof registrationGrowth === 'number' && registrationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {typeof registrationGrowth === 'number'
                        ? `${registrationGrowth >= 0 ? '+' : ''}${registrationGrowth}%`
                        : registrationGrowth}
                    </p>

                    {typeof registrationGrowth === 'number' ? (
                      registrationGrowth >= 0
                        ? <TrendingUp className="w-4 h-4 text-green-600 ml-auto" />
                        : <TrendingDown className="w-4 h-4 text-red-600 ml-auto" />
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Revenue Growth</p>
                    <p className="text-xs text-muted-foreground">vs last month</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${typeof revenueGrowth === 'number' && revenueGrowth >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      }`}>
                      {typeof revenueGrowth === 'number'
                        ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`
                        : revenueGrowth}
                    </p>
                    {typeof revenueGrowth === 'number' ? (
                      revenueGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 ml-auto" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 ml-auto" />
                      )
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Events Created</p>
                    <p className="text-xs text-muted-foreground">this month</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-blue-600">
                      {currentMonthData?.events || 0}
                    </p>
                    <Calendar className="w-4 h-4 text-blue-600 ml-auto" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Trends & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Registration Trends
              </CardTitle>
              <CardDescription>Monthly registration and revenue trends</CardDescription>
            </CardHeader>
            <CardContent className='max-[680px]:p-0'>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventAnalytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      const val = typeof value === 'number' ? value : 0;
                      const label = String(name || '');
                      return [
                        label === 'events' ? `${val} events` :
                          label === 'registrations' ? `${val} registrations` :
                            formatCurrency(val),
                        label === 'events' ? 'Events Created' :
                          label === 'registrations' ? 'Registrations' : 'Revenue'
                      ];
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="registrations"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="registrations"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="revenue"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Enhanced Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Category Performance
              </CardTitle>
              <CardDescription>
                Event performance by category
              </CardDescription>
            </CardHeader>
            <CardContent className='max-[680px]:p-0'>
              <div className="space-y-0">
                {eventAnalytics.categoryPerformance && eventAnalytics.categoryPerformance.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" className="h-[300px] md:h-[250px] relative md:block right-4 top-2" height={isMobile ? 300 : 200}>
                      <BarChart data={eventAnalytics.categoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number | string, name: string) => [
                            name === 'registrations' ? `${value} registrations` : formatCurrency(typeof value === 'number' ? value : parseFloat(value as string) || 0),
                            name === 'registrations' ? 'Registrations' : 'Revenue'
                          ]}
                        />
                        <Bar dataKey="registrations" fill="#3b82f6" name="registrations" />
                        <Bar dataKey="revenue" fill="#10b981" name="revenue" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {eventAnalytics.categoryPerformance.map((category: any, index: number) => (
                        <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium text-sm">{category.category}</p>
                              <p className="text-xs text-muted-foreground">
                                {category.events} events
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{category.registrations} registrations</p>
                            <p className="text-xs text-green-600">{formatCurrency(category.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No category performance data available</p>
                    <p className="text-xs mt-1">Create events in different categories to see performance metrics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Most Booked Events & Recent Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Booked Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Most Booked Events
              </CardTitle>
              <CardDescription>Top performing events by registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventAnalytics.popularEvents && eventAnalytics.popularEvents.length > 0 ? (
                  eventAnalytics.popularEvents.map((event: any, index: number) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.registrations} registrations
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(event.revenue)}
                        </p>
                        <Badge
                          variant={event.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No popular events data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Recent Registrations
              </CardTitle>
              <CardDescription>Latest event registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventAnalytics.recentRegistrations && eventAnalytics.recentRegistrations.length > 0 ? (
                  eventAnalytics.recentRegistrations.slice(0, 8).map((registration: { id: string; event_title: string; participant_name: string; registration_date: string; payment_amount: number; status: string }, index: number) => (
                    <div key={registration.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {registration.participant_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{registration.participant_name}</p>
                          <p className="text-xs text-muted-foreground">{registration.event_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-green-600">
                          {formatCurrency(registration.payment_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(registration.registration_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent registrations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Comparison & Registration Timeline */}
        <div className="grid grid-cols-1 gap-6">
          {/* Event Status Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                Event Status & Registration Comparison
              </CardTitle>
              <CardDescription>Compare performance across event statuses and categories</CardDescription>
            </CardHeader>
            <CardContent className='p-0 relative md:block right-6'>
              <ResponsiveContainer width={isMobile ? "105%" : "100%"} height={400}>

                <AreaChart className='w-full' data={eventAnalytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation='left' x={-10} className='relative right-10' />
                  {/* <YAxis yAxisId="right" orientation="right" /> */}
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      const val = typeof value === 'number' ? value : 0;
                      const label = String(name || '');
                      return [
                        label === 'events' ? `${val} events` :
                          label === 'registrations' ? `${val} registrations` :
                            formatCurrency(val),
                        label === 'events' ? 'Events Created' :
                          label === 'registrations' ? 'Registrations' : 'Revenue'
                      ];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="events"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="events"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="registrations"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="registrations"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="revenue"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                  />
                </AreaChart>

              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 h-screen flex justify-center items-center">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  // Calculate totals across all categories
  const totalRevenue = Object.values(analytics).reduce((sum: number, cat: any) =>
    sum + (cat.totalRevenue || 0), 0
  );
  const totalProducts = (analytics.shop?.totalProducts || 0) + (analytics.vehicle?.totalVehicles || 0) + (analytics.service?.totalServices || 0);
  const totalOrders = (analytics.shop?.totalOrders || 0) + (analytics.vehicle?.totalSales || 0) + (analytics.service?.totalBookings || 0);

  const hasEventCategory = vendorData?.categories?.includes('Event');
console.log(analytics.service)
  return (
    <div className="px-[5px]  md:px-5 py-8 pb-16 md:pb-0 ">
      <div className='relative bottom-5 right-4'>
        <Back></Back>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your business performance across all categories</p>
          </div>
          {/* <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedPeriod === period
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div> */}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue + (eventAnalytics?.totalRevenue || 0))}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products/Services</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts + (eventAnalytics?.totalEvents || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                Active listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders + (eventAnalytics?.totalRegistrations || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                All time orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((totalOrders + (eventAnalytics?.totalRegistrations || 0)) > 0 ? (totalRevenue + (eventAnalytics?.totalRevenue || 0)) / (totalOrders + (eventAnalytics?.totalRegistrations || 0)) : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                Per transaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category-wise Analytics */}
        <Tabs defaultValue={hasEventCategory ? "event" : Object.keys(analytics)[0]} className="w-full">
          <TabsList className='w-full'>
            <div className="flex overflow-scroll scrollbar-hide scroll-smooth md:grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(analytics).length + (hasEventCategory ? 1 : 0)}, 1fr)` }}>
              {hasEventCategory && (
                <TabsTrigger value="event">
                  Event Analytics
                </TabsTrigger>
              )}
              {Object.keys(analytics).map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category} Analytics
                </TabsTrigger>
              ))}
            </div>
          </TabsList>


          {/* Event Analytics */}
          {hasEventCategory && eventAnalytics && (
            <TabsContent value="event">
              {renderEventAnalytics()}
            </TabsContent>
          )}

          {/* Shop Analytics */}
          {analytics.shop && (
            <TabsContent value="shop">
              <div className="space-y-6">
                {/* Enhanced Shop Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-y-3 md:gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.shop.totalProducts}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.shop.totalOrders}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {analytics.shop.pendingOrders} Pending
                        </Badge>
                        <Badge variant="default" className="text-xs bg-blue-600">
                          <Truck className="w-3 h-3 mr-1" />
                          {analytics.shop.shippedOrders || 0} Shipped
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Delivered Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{analytics.shop.deliveredOrders || 0}</div>
                      <Badge variant="default" className="text-xs bg-green-600 mt-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {analytics.shop.completedOrders} Completed
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(analytics.shop.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        Avg: {formatCurrency(analytics.shop.avgOrderValue)} per order
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Units Sold</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.shop.totalSales}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Major Cities Analytics */}
                {analytics.shop.locationAnalytics.majorCitiesData && Object.keys(analytics.shop.locationAnalytics.majorCitiesData).length > 0 &&

                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Major Cities Sales Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                          {Object.entries(analytics.shop.locationAnalytics.majorCitiesData).map(([city, data]) => (
                            <div key={city} className="text-center p-4 border rounded-lg">
                              <div className="text-lg font-bold capitalize">
                                {city === 'others' ? 'Other Cities' : city}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Orders: {data.orders}</div>
                                <div>Revenue: {formatCurrency(data.revenue)}</div>
                                <div>Customers: {data.customers}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3">Revenue by Major Cities</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={Object.entries(analytics.shop.locationAnalytics.majorCitiesData)
                                    .filter(([_, data]) => data.revenue > 0)
                                    .map(([city, data]) => ({
                                      name: city === 'others' ? 'Other Cities' : city.charAt(0).toUpperCase() + city.slice(1),
                                      value: data.revenue,
                                      orders: data.orders,
                                      customers: data.customers
                                    }))}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  labelLine={false}
                                  label={(props: { name?: string; percent?: number; x?: number; y?: number }) => {
                                    const { name = '', percent = 0, x = 0, y = 0 } = props;
                                    return (
                                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className='text-[13px] md:text-[15px]' fontSize={15}>
                                        {`${name}: ${(percent * 100).toFixed(0)}%`}
                                      </text>
                                    );
                                  }}
                                >
                                  {Object.entries(analytics.shop.locationAnalytics.majorCitiesData).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div>
                            <h4 className="font-medium mb-3">Orders by Major Cities</h4>
                            <ResponsiveContainer width={isMobile ? "107%" : "100%"} height={300} className="max-[768px]:relative right-7 top-3">
                              <BarChart
                                data={Object.entries(analytics.shop.locationAnalytics.majorCitiesData)
                                  .filter(([_, data]) => data.orders > 0)
                                  .map(([city, data]) => ({
                                    city: city === 'others' ? 'Others' : city.charAt(0).toUpperCase() + city.slice(1),
                                    orders: data.orders,
                                    revenue: data.revenue
                                  }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="city" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="orders" fill="#ef4444" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>


                    {/* Top Cities by Revenue */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Performing Cities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics.shop.locationAnalytics.topCities.slice(0, 10).map((city, index) => (
                            <div key={city.city} className="flex justify-between items-center p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">#{index + 1}</Badge>
                                <div>
                                  <p className="font-medium">{city.city}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {city.orders} orders
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(city.revenue)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {city.percentage.toFixed(1)}% of total
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>}
                {/* Order Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Order Status Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {analytics.shop.ordersByStatus?.pending || analytics.shop.pendingOrders}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending Orders</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Truck className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.shop.ordersByStatus?.shipped || analytics.shop.shippedOrders || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Shipped Orders</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.shop.ordersByStatus?.delivered || analytics.shop.deliveredOrders || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Delivered Orders</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Award className="w-8 h-8 text-green-700" />
                        </div>
                        <div className="text-2xl font-bold text-green-700">
                          {analytics.shop.ordersByStatus?.completed || analytics.shop.completedOrders}
                        </div>
                        <p className="text-sm text-muted-foreground">Completed Orders</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.shop.ordersByStatus?.cancelled || analytics.shop.cancelledOrders}
                        </div>
                        <p className="text-sm text-muted-foreground">Cancelled Orders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Inventory Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.shop.inventoryMetrics.outOfStockProducts}
                        </div>
                        <p className="text-sm text-muted-foreground">Out of Stock</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {analytics.shop.inventoryMetrics.lowStockProducts}
                        </div>
                        <p className="text-sm text-muted-foreground">Low Stock (&lt;5)</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(analytics.shop.inventoryMetrics.totalInventoryValue)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(analytics.shop.inventoryMetrics.averageStockLevel)}
                        </div>
                        <p className="text-sm text-muted-foreground">Avg Stock Level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width={isMobile ? "107%" : "100%"} height={300} className="max-[768px]:relative right-7 top-3">
                        <AreaChart data={analytics.shop.salesTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value as number) : value,
                            name === 'revenue' ? 'Revenue' : 'Orders'
                          ]} />
                          <Area type="monotone" dataKey="revenue" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.shop.topSellingProducts.length &&
                        <div className="space-y-3">
                          {analytics.shop.topSellingProducts.slice(0, 5).map((product, index) => (
                            <div key={product.id} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.totalSold} units sold
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(product.revenue)}</p>
                                <Badge variant="secondary">#{index + 1}</Badge>
                              </div>
                            </div>
                          ))}
                        </div> || <div className="text-center py-8 text-muted-foreground">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No data available</p>
                        </div>}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders with Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Recent Customer Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                   {analytics.shop?.recentOrders.length &&
                    <div className="space-y-3">
                      {analytics.shop.recentOrders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 border rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <Badge variant={
                                order.status === 'completed' ? 'default' :
                                  order.status === 'delivered' ? 'default' :
                                    order.status === 'shipped' ? 'default' :
                                      order.status === 'pending' ? 'secondary' : 'destructive'
                              } className={
                                order.status === 'delivered' ? 'bg-green-600' :
                                  order.status === 'shipped' ? 'bg-blue-600' : ''
                              }>
                                {order.status === 'delivered' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {order.status === 'shipped' && <Truck className="w-3 h-3 mr-1" />}
                                {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Customer: {order.customer_name || 'Unknown'} • {order.items} items • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(order.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    ||
                    <div className="text-center py-8 text-muted-foreground">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No data available</p>
                        </div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Vehicle Analytics */}
          {analytics.vehicle && (
            <TabsContent value="vehicle">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vehicle Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Vehicles</span>
                        <Badge variant="secondary">{analytics.vehicle.totalVehicles}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sold Vehicles</span>
                        <Badge variant="default" className="bg-green-600">{analytics.vehicle.soldVehicles}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Listings</span>
                        <Badge variant="secondary">{analytics.vehicle.activeListings}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <Badge variant="secondary">{formatCurrency(analytics.vehicle.totalRevenue)}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.vehicle.categoryBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.vehicle.categoryBreakdown.map((category, index) => (
                        <div key={category.category} className="flex justify-between items-center">
                          <span className="text-sm">{category.category}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{category.count} vehicles</div>
                            <div className="text-xs text-muted-foreground">
                              Avg: {formatCurrency(category.avgPrice)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Service Analytics */}
          {analytics.service && (
            <TabsContent value="service">
              <div className="space-y-6">
                {/* Service Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-y-3 md:gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.service.totalServices}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.service.totalBookings}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(analytics.service.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        Avg: {formatCurrency(analytics.service.avgBookingValue)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold flex items-center">
                        <Star className="w-5 h-5 text-yellow-500 mr-1" />
                        {analytics.service.serviceRatings.averageRating.toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.service.serviceRatings.totalRatings} ratings
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.service.customerMetrics.totalCustomers}</div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <UserPlus className="w-3 h-3 mr-1" />
                          {analytics.service.customerMetrics.newCustomers} New
                        </Badge>
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Repeat className="w-3 h-3 mr-1" />
                          {analytics.service.customerMetrics.repeatCustomers} Repeat
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{analytics.service.upcomingBookings}</div>
                      <p className="text-xs text-muted-foreground">
                        Confirmed bookings
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Booking Status Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Booking Status Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {analytics.service.pendingBookings}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.service.confirmedBookings}
                        </div>
                        <p className="text-sm text-muted-foreground">Confirmed</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Award className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.service.completedBookings}
                        </div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.service.cancelledBookings}
                        </div>
                        <p className="text-sm text-muted-foreground">Cancelled</p>
                      </div>

                      <div className="text-center p-4 border rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics.service.upcomingBookings}
                        </div>
                        <p className="text-sm text-muted-foreground">Upcoming</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Most Requested Services & Service Ratings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               
               {analytics.service.mostRequestedServices && analytics.service.mostRequestedServices.length ?   <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Most Requested Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.service.mostRequestedServices.slice(0, 8).map((service, index) => (
                          <div key={service.id} className="flex justify-between items-center p-3 border rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary">#{index + 1}</Badge>
                                <p className="font-medium">{service.title}</p>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{service.category}</span>
                                <span>{service.bookingCount} bookings</span>
                                {service.avgRating > 0 && (
                                  <div className="flex items-center">
                                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                    {service.avgRating.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(service.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>:<></>}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ThumbsUp className="w-5 h-5 mr-2" />
                        Service Ratings Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold flex items-center justify-center">
                            <Star className="w-8 h-8 text-yellow-500 mr-2" />
                            {analytics.service.serviceRatings.averageRating.toFixed(1)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on {analytics.service.serviceRatings.totalRatings} reviews
                          </p>
                        </div>

                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="text-sm w-8">{rating}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-500 h-2 rounded-full"
                                  style={{
                                    width: `${analytics.service?.serviceRatings?.totalRatings && analytics.service.serviceRatings.totalRatings > 0
                                      ? ((analytics.service.serviceRatings.ratingDistribution[rating as keyof typeof analytics.service.serviceRatings.ratingDistribution] || 0) / analytics.service.serviceRatings.totalRatings) * 100
                                      : 0}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm w-8">
                                {analytics.service?.serviceRatings?.ratingDistribution?.[rating as keyof typeof analytics.service.serviceRatings.ratingDistribution] || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Performance & Customer Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
               {analytics.service.categoryPerformance && analytics.service.categoryPerformance.length ?
                      <ResponsiveContainer width={isMobile ? "107%" : "100%"} height={300} className={"max-[768px]:relative right-7 top-3"}>
                        <BarChart data={analytics.service.categoryPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value as number) : value,
                            name === 'revenue' ? 'Revenue' : name === 'bookings' ? 'Bookings' : 'Avg Rating'
                          ]} />
                          <Bar dataKey="bookings" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>:<div className="text-center py-8 text-muted-foreground">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No data available</p>
                        </div>}
                    </CardContent>
                  </Card>

            
            <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Customer Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded">
                            <div className="text-2xl font-bold text-green-600">
                              {analytics.service.customerMetrics.customerRetentionRate.toFixed(1)}%
                            </div>
                            <p className="text-sm text-muted-foreground">Retention Rate</p>
                          </div>
                          <div className="text-center p-3 border rounded">
                            <div className="text-2xl font-bold text-blue-600">
                              {analytics.service.customerMetrics.totalCustomers}
                            </div>
                            <p className="text-sm text-muted-foreground">Total Customers</p>
                          </div>
                        </div>
  {analytics.service.customerMetrics.newCustomers ?   
                        <ResponsiveContainer width={isMobile ? "107%" : "100%"} height={250} className={"max-[768px]:relative right-7 top-3"}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'New Customers', value: analytics.service.customerMetrics.newCustomers },
                                { name: 'Repeat Customers', value: analytics.service.customerMetrics.repeatCustomers }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              labelLine={false}
                              label={(props: { name?: string; percent?: number; x?: number; y?: number }) => {
                                const { name = '', percent = 0, x = 0, y = 0 } = props;
                                return (
                                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className='text-[13px] md:text-[15px]' fontSize={10}>
                                    {`${name}: ${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                              }}
                            >
                              <Cell fill="#00C49F" />
                              <Cell fill="#FFBB28" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>:<></>}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Booking Trends & Monthly Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width={isMobile ? "107%" : "100%"} height={300} className={"max-[768px]:relative right-7 top-3"}>
                        <AreaChart data={analytics.service.bookingTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value as number) : value,
                            name === 'revenue' ? 'Revenue' : 'Bookings'
                          ]} />
                          <Area type="monotone" dataKey="bookings" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Performance (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width={isMobile ? "115%" : "100%"} height={300} className={"max-[768px]:relative right-7 top-3"}>
                        <LineChart data={analytics.service.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Bar yAxisId="left" dataKey="bookings" fill="#ef4444" />
                          <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#00C49F" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Recent Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.service.recentBookings.length ?
                    <div className="space-y-3">
                      {analytics.service.recentBookings.slice(0, 10).map((booking) => (
                        <div key={booking.id} className="flex justify-between items-center p-3 border rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-medium">{booking.service_title}</p>
                              <Badge variant={
                                booking.status === 'completed' ? 'default' :
                                  booking.status === 'confirmed' ? 'default' :
                                    booking.status === 'pending' ? 'secondary' : 'destructive'
                              } className={
                                booking.status === 'completed' ? 'bg-green-600' :
                                  booking.status === 'confirmed' ? 'bg-blue-600' : ''
                              }>
                                {booking.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {booking.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {booking.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Customer: {booking.customer_name} • Date: {new Date(booking.booking_date).toLocaleDateString()}
                              {booking.notes && ` • Notes: ${booking.notes}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>:<div className="text-center py-8 text-muted-foreground">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No data available</p>
                        </div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default VendorAnalytics;

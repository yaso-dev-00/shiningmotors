"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Star,
  TrendingUp,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Filter,
  Search,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getServices,
  deleteService,
  ServicePost,
} from "@/integrations/supabase/modules/services";
import { vendorAnalyticsApi, ServiceAnalytics } from "@/integrations/supabase/modules/vendorAnalytics";
import { useToast } from "@/hooks/use-toast";
import Back from "./Back";

const ServiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<ServicePost[]>([]);
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingFilter, setBookingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, Array<{
    id: string;
    service_id: string;
    service_title: string;
    booking_date: string;
    status: string;
    user_id: string;
    customer_name?: string;
    notes?: string;
  }>>>({});

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (analytics?.recentBookings) {
      // Group bookings by date for calendar highlighting
      const bookingMap: Record<string, Array<{
        id: string;
        service_id: string;
        service_title: string;
        booking_date: string;
        status: string;
        user_id: string;
        customer_name?: string;
        notes?: string;
      }>> = {};
      analytics.recentBookings.forEach((booking) => {
        const date = new Date(booking.booking_date).toISOString().split("T")[0];
        if (!bookingMap[date]) {
          bookingMap[date] = [];
        }
        bookingMap[date].push(booking);
      });
      setBookingsByDate(bookingMap);
    }
  }, [analytics]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [servicesResult, analyticsResult] = await Promise.all([
        getServices(user.id),
        vendorAnalyticsApi.getServiceAnalytics(user.id),
      ]);

      if (servicesResult.error) throw servicesResult.error;
      if (analyticsResult.error) throw analyticsResult.error;

      setServices(servicesResult.data || []);
      setAnalytics(analyticsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load service data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const { success, error } = await deleteService(id);

      if (!success) throw error;

      setServices(services.filter((service) => service.id !== id));
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // Mock status update - replace with actual API call
      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`,
      });
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const handleRequestMoreTime = async (bookingId: string, additionalTime: number) => {
    try {
      // Mock request more time - replace with actual API call
      toast({
        title: "Success",
        description: "Request for additional time sent to customer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send time extension request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDateBookingStatus = (date: Date | undefined) => {
    if (!date) return null;

    const dateStr = date.toISOString().split("T")[0];
    const bookings = bookingsByDate[dateStr] || [];

    if (bookings.length === 0) return null;

    // Count each status type
    const statusCounts: Record<string, number> = bookings.reduce((counts, booking) => {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Return the most common status
    const statuses = Object.keys(statusCounts);
    if (statuses.length === 0) return null;

    return statuses.reduce((a, b) =>
      statusCounts[a] > statusCounts[b] ? a : b
    );
  };

  const getDateClassName = (date: Date | undefined) => {
    const status = getDateBookingStatus(date);
    if (!status) return "";

    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 font-bold";
      case "confirmed":
        return "bg-blue-100 text-blue-800 font-bold";
      case "completed":
        return "bg-green-100 text-green-800 font-bold";
      case "cancelled":
        return "bg-red-100 text-red-800 font-bold";
      default:
        return "";
    }
  };

  const filteredBookings =
    analytics?.recentBookings?.filter((booking) => {
      const matchesFilter =
        bookingFilter === "all" || booking.status === bookingFilter;
      const matchesSearch =
        booking.service_title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesFilter && matchesSearch;
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Back />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Back />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Service Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your services, bookings, and customer relationships
              </p>
            </div>
            <NextLink href={"/vendor/service/create" as any}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </NextLink>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-2 mb-5 md:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Bookings
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalBookings}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.upcomingBookings} upcoming
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{analytics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg ₹{analytics.avgBookingValue.toFixed(0)} per booking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.serviceRatings.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.serviceRatings.totalRatings} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalBookings > 0
                    ? (
                        (analytics.completedBookings /
                          analytics.totalBookings) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.completedBookings} completed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="bookings" className="w-full mt-2">
          <TabsList className="w-full">
            <div className="flex md:grid w-full grid-cols-5 overflow-scroll scrollbar-hide">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-y-3  justify-start md:justify-between">
                  <CardTitle className="flex">
                    <Users className="w-5 h-5 mr-2" />
                    Service Bookings
                  </CardTitle>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select
                      value={bookingFilter}
                      onValueChange={setBookingFilter}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-[768px]:p-2">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Bookings Found
                    </h3>
                    <p className="text-gray-600">
                      No bookings match your current filters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {booking.service_title}
                            </h3>
                            <p className="text-gray-600">
                              Customer: {booking.customer_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Date:{" "}
                              {new Date(
                                booking.booking_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        {booking.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              <strong>Notes:</strong> {booking.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Select
                            value={booking.status}
                            onValueChange={(value) =>
                              handleStatusUpdate(booking.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRequestMoreTime(booking.id, 30)
                            }
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Request Time
                          </Button>

                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            Contact
                          </Button>

                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Booking Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="max-[768px]:p-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 justify-center mb-2 text-sm">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-100"></span>{" "}
                        Pending
                        <span className="inline-block w-3 h-3 rounded-full bg-blue-100"></span>{" "}
                        Confirmed
                        <span className="inline-block w-3 h-3 rounded-full bg-green-100"></span>{" "}
                        Completed
                        <span className="inline-block w-3 h-3 rounded-full bg-red-100"></span>{" "}
                        Cancelled
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                      required={false}
                      modifiersClassNames={{
                        selected: "bg-primary text-primary-foreground",
                      }}
                      modifiers={{
                        pending: (date) =>
                          getDateBookingStatus(date) === "pending",
                        confirmed: (date) =>
                          getDateBookingStatus(date) === "confirmed",
                        completed: (date) =>
                          getDateBookingStatus(date) === "completed",
                        cancelled: (date) =>
                          getDateBookingStatus(date) === "cancelled",
                      }}
                      modifiersStyles={{
                        pending: {
                          backgroundColor: "#fef9c3",
                          color: "#854d0e",
                          fontWeight: "bold",
                        },
                        confirmed: {
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          fontWeight: "bold",
                        },
                        completed: {
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          fontWeight: "bold",
                        },
                        cancelled: {
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <h3 className="font-semibold mb-4">
                      Bookings for {selectedDate?.toDateString()}
                    </h3>
                    <div className="space-y-3">
                      {filteredBookings
                        .filter(
                          (booking) =>
                            new Date(booking.booking_date).toDateString() ===
                            selectedDate?.toDateString()
                        )
                        .map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {booking.service_title}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.customer_name}
                              </p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        ))}
                      {filteredBookings.filter(
                        (booking) =>
                          new Date(booking.booking_date).toDateString() ===
                          selectedDate?.toDateString()
                      ).length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No bookings for this date
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Your Services ({services.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-[768px]:p-2">
                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Services Offered
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start by adding your first service offering
                    </p>
                    <NextLink href={"/vendor/service/create" as any}>
                      <Button>Add Your First Service</Button>
                    </NextLink>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg truncate">
                            {service.title}
                          </h3>
                          <div className="flex gap-1">
                            <NextLink href={`/vendor/service/edit/${service.id}` as any}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </NextLink>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => service.id && handleDeleteService(service.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {service.media_urls &&
                          service.media_urls.length > 0 && (
                            <img
                              src={service.media_urls[0]}
                              alt={service.title || "Service"}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-green-600">
                            {service.price}
                          </p>
                          <p className="text-sm text-gray-500">
                            Duration: {service.duration}
                          </p>
                          <p className="text-sm text-gray-500">
                            Location: {service.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="max-[768px]:p-2">
                {analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {analytics.customerMetrics.totalCustomers}
                        </div>
                        <p className="text-sm text-gray-600">Total Customers</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {analytics.customerMetrics.repeatCustomers}
                        </div>
                        <p className="text-sm text-gray-600">
                          Repeat Customers
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {analytics.customerMetrics.customerRetentionRate.toFixed(
                            1
                          )}
                          %
                        </div>
                        <p className="text-sm text-gray-600">Retention Rate</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">
                        Recent Customer Feedback
                      </h3>
                      <div className="space-y-3">
                        {analytics.recentBookings.slice(0, 5).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {booking.customer_name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {booking.customer_name || "Unknown Customer"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {booking.service_title}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center  gap-2">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-current"
                                  />
                                ))}
                              </div>
                              <Button variant="outline" size="sm">
                                <Mail className="w-4 h-4 mr-1" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No customer data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-4 md:space-y-6">
              {analytics && (
                <>
                  <Card>
                    <CardHeader className="max-[769px]:py-4">
                      <CardTitle>Service Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="max-[768px]:p-2">
                      <div className="space-y-4">
                        {analytics.mostRequestedServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <h3 className="font-medium">{service.title}</h3>
                              <p className="text-sm text-gray-600">
                                {service.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {service.bookingCount} bookings
                              </p>
                              <p className="text-sm text-gray-600">
                                ₹{service.revenue.toLocaleString()} revenue
                              </p>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm">
                                  {service.avgRating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="max-[769px]:py-4">
                      <CardTitle>Monthly Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="max-[768px]:p-2">
                      <div className="space-y-4">
                        {analytics.monthlyTrends.map((trend) => (
                          <div
                            key={trend.month}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="font-medium">{trend.month}</div>
                            <div className="flex gap-6 text-sm">
                              <span>{trend.bookings} bookings</span>
                              <span>₹{trend.revenue.toLocaleString()}</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span>{trend.avgRating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceManagement;

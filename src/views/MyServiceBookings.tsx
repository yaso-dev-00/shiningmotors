"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/Layout";
import { toast } from "sonner";

import {

  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, User, Tag, MessageSquare, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface ServiceBooking {
  id: number;
  service_id: string | null;
  vendor_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
  notes: string | null;
  booking_slot: string | null;
  booking_date: string | null;
  status: string | null;
  service?: {
    title: string | null;
    price: string | null;
    description: string | null;
    category: string | null;
    media_urls: string[] | null;
    location: string | null;
  };
  vendor?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ServiceBookings = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "all" |"cancelled">("all");

  // Fetch service bookings for the logged-in user
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["serviceBookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("service_bookings")
        .select(`
          *,
          service:services(*),
          vendor:profiles!service_bookings_vendor_id_fkey(username, full_name, avatar_url)
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching service bookings:", error);
        toast({
          title: "Error fetching bookings",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return (data || []) as unknown as ServiceBooking[];
    },
    enabled: !!user?.id,
  });

  const statusColorMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-green-100 text-green-800 border-green-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    rescheduled: "bg-purple-100 text-purple-800 border-purple-300",
  };

  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    const today = new Date();
    
    switch (activeTab) {
      case "upcoming":
        return bookings.filter(booking => {
          if (!booking.booking_date) return false;
          const bookingDate = new Date(booking.booking_date);
          return bookingDate >= today && booking.status !== "cancelled";
        });
      case "past":
        return bookings.filter(booking => {
          if (!booking.booking_date) return false;
          const bookingDate = new Date(booking.booking_date);
          return bookingDate < today && booking.status === "completed";
        });
      case "cancelled":
        return bookings.filter(booking => {
          if (!booking.booking_date) return false;
          const bookingDate = new Date(booking.booking_date);
          return  booking.status === "cancelled";
        });
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  // Statistics calculation
  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === "confirmed").length || 0;
  const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking cancelled",
        description: "Your service booking has been cancelled successfully.",
      });
      
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel booking";
      toast({
        title: "Error cancelling booking",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

 
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sm-red"></div>
      </div>
    );
  }

  const handleDeleteItem = (bookingId:number) => {
    confirmToast({
      title: "Are you sure to cancel the service?",
      description: "This action cannot be undone.",
      confirmText: "Confirm",
      cancelText: "Keep",
      onConfirm: () => {
          handleCancelBooking(bookingId)
      }
    });
  };

  return (
    <Layout>
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Service Bookings</h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Bookings" 
            value={totalBookings} 
            icon={<Calendar className="h-8 w-8 text-sm-red" />}
            bgClass="bg-gradient-to-br from-red-50 to-red-100"
          />
          <StatCard 
            title="Pending" 
            value={pendingBookings} 
            icon={<Clock className="h-8 w-8 text-yellow-500" />}
            bgClass="bg-gradient-to-br from-yellow-50 to-yellow-100"
          />
          <StatCard 
            title="Confirmed" 
            value={confirmedBookings} 
            icon={<Check className="h-8 w-8 text-green-500" />}
            bgClass="bg-gradient-to-br from-green-50 to-green-100"
          />
          <StatCard 
            title="Completed" 
            value={completedBookings} 
            icon={<Check className="h-8 w-8 text-blue-500" />}
            bgClass="bg-gradient-to-br from-blue-50 to-blue-100"
          />
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide">
          <TabButton 
            isActive={activeTab === "all"} 
            onClick={() => setActiveTab("all")}
            label="All Bookings"
          />
          <TabButton 
            isActive={activeTab === "upcoming"} 
            onClick={() => setActiveTab("upcoming")}
            label="Upcoming"
          />
          <TabButton 
            isActive={activeTab === "past"} 
            onClick={() => setActiveTab("past")}
            label="Completed"
          />
           <TabButton 
            isActive={activeTab === "cancelled"} 
            onClick={() => setActiveTab("cancelled")}
            label="Cancelled"
          />
        </div>

        {/* Service Booking Cards */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <Calendar className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">You don't have any {activeTab} service bookings yet.</p>
            <Button 
              onClick={() => router.push("/services" as any)}
              className="bg-sm-red hover:bg-sm-red/90 text-white"
            >
              Browse Services
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Card className="h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300 border border-gray-200">
                  {booking.service?.media_urls?.[0] && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={booking.service.media_urls[0]}
                        alt={booking.service.title || "Service image"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className={`px-2 py-1 border ${statusColorMap[booking.status || "pending"]}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            {booking.status || "Pending"}
                          </span>
                        </Badge>
                      </div>
                      {booking.service?.category && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-sm-red/20 text-sm-red">
                            <Tag size={12} className="mr-1" />
                            {booking.service.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{booking.service?.title || "Unnamed Service"}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin size={14} className="mr-1 text-sm-red" />
                          <span>{booking.service?.location || "Location not specified"}</span>
                        </CardDescription>
                      </div>
                      <div className="text-sm font-semibold text-sm-red">
                       {booking.service?.price ? (booking.service.price.startsWith('₹') ? booking.service.price : `₹${booking.service.price}`) : 'Price not available'}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {/* Booking details */}
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-sm-red" />
                        <span className="font-medium">Date:</span>
                        <span className="ml-2">{formatDate(booking.booking_date)}</span>
                      </div>
                      
                      {booking.booking_slot && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-sm-red" />
                          <span className="font-medium">Time:</span>
                          <span className="ml-2">{booking.booking_slot}</span>
                        </div>
                      )}
                      
                      {/* Provider details */}
                      <div className="flex items-center pt-2">
                        <Avatar className="h-8 w-8 mr-2 ring-2 ring-sm-red/10">
                          <AvatarImage src={booking.vendor?.avatar_url || undefined} />
                          <AvatarFallback>
                            {booking.vendor?.full_name?.charAt(0) || booking.vendor?.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{booking.vendor?.full_name || booking.vendor?.username || "Service Provider"}</div>
                          <div className="text-xs text-gray-500">Service Provider</div>
                        </div>
                      </div>
                      
                      {/* Notes */}
                      {booking.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-start">
                            <MessageSquare className="h-4 w-4 mr-2 mt-1 text-sm-red" />
                            <div>
                              <div className="font-medium text-sm text-gray-700">Notes:</div>
                              <p className="text-gray-600 text-sm">{booking.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="border-t pt-4 flex flex-col sm:flex-row  gap-3 sm:gap-0 justify-between mt-auto bg-gray-50 ">
                   {booking.status !== "cancelled" && <div className="text-sm text-gray-500">
                      Booked on {formatDate(booking.created_at)}
                    </div>}
                    {booking.status === "cancelled" && <p className="text-sm-red text-sm">Cancelled on {formatDate(booking.updated_at)}</p>}
                    {booking.status !== "cancelled" && booking.status !== "completed" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteItem(booking.id)}
                      >
                        Cancel Booking
                      </Button>
                    )}
                    
                    {booking.service_id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-sm-red text-sm-red hover:bg-sm-red hover:text-white"
                        onClick={() => router.push(`/services/${booking.service_id}` as any)}
                      >
                        View Service
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
    </Layout>
  );
};

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  bgClass = "bg-white" 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  bgClass?: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${bgClass} border hover:shadow-md transition-all duration-300`}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className="rounded-full p-3 bg-white/70 shadow-sm">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Tab Button Component
const TabButton = ({ 
  isActive, 
  onClick, 
  label 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  label: string;
}) => {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
        isActive 
          ? "border-sm-red text-sm-red" 
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default ServiceBookings;



type ConfirmToastOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  duration?: number;
  id?:string
};

export const confirmToast = ({
  id = "confirm-toast",
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  duration = Infinity,
}: ConfirmToastOptions) => {
     toast.dismiss(id);
       (toast as any)((t: any) => (
    
    <div className="w-full">
      <h3 className="font-medium text-sm">{title}</h3>
      {description && <p className="text-sm mt-1 text-gray-400">{description}</p>}
      <div className="flex gap-2 justify-start mt-4">
        <button
          onClick={() => {
            onCancel?.();
            toast.dismiss(t);
          }}
          className="px-3 py-1 rounded-md bg-racing-gray hover:bg-racing-gray/80   text-xs flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            toast.dismiss(t);
          }}
          className="px-3 py-1 rounded-md  hover:bg-racing-red/80 text-white bg-red-700 text-xs flex items-center gap-1"
        >
          <Check className="h-3 w-3" />
          {confirmText}
        </button>
      </div>
    </div>
          
  ), {
    duration,
    id
  });
};
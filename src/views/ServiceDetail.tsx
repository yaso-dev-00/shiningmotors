"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getServiceById, bookService } from "@/integrations/supabase/modules/services";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCategoryById } from "@/data/serviceCategories";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Star,
  User,
  Phone,
  MessageSquare,
  Check,
  Heart
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceCard from "@/components/services/ServiceCard";

const ServiceDetail = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingNote, setBookingNote] = useState<string>("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(()=>{
       window.scrollTo({top:0})
   },[])
  // Fetch service details
  const { data: serviceData, isLoading, error } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      if (!id) throw new Error("Service ID is required");
      const { data, error } = await getServiceById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
console.log(serviceData)

  const service = serviceData;
  const category = serviceData?.category ? getCategoryById(serviceData.category) : undefined;

  // Array of available times for booking
  // const availableTimes = [
  //   "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  //   "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  // ];
  // const today=new Date().getDay()
  // const filterTimings=availableTimes.filter((item)=>{
  //      return 
  // })
  
  const filteredTimes = filterAvailableTimes(
    (service?.availability as Record<string, { start?: string; end?: string }> | null | undefined) || null,
    selectedDate
  );
  console.log(filteredTimes)
  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to book this service",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete booking details",
        description: "Please select both date and time for your booking",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!service?.profile?.id) {
        throw new Error("Service provider information is missing");
      }
      const result = await bookService(
        id!,
        user!.id,
        service.profile.id,
        {
          date: format(selectedDate, "MMMM d, yyyy"),
          time: selectedTime,
          notes: bookingNote
        }
      );

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Booking Successful",
        description: "Your service booking has been submitted. The provider will contact you soon.",
      });

      setIsBookingDialogOpen(false);
      setSelectedDate(undefined);
      setSelectedTime("");
      setBookingNote("");
      router.push('/myServiceBookings')
    } catch (err) {
      console.error("Error booking service:", err);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-8 w-72 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !service) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-6">
            The service you are looking for could not be found or has been removed.
          </p>
          <Button
            onClick={() => router.push("/services")}
            className="bg-sm-red hover:bg-sm-red-light"
          >
            Browse All Services
          </Button>
        </div>
      </Layout>
    );
  }
console.log(category)
  return (
    <Layout>
      <div className="container px-4 py-4 mx-auto">
        {/* Breadcrumb navigation */}
        <div className="text-sm text-gray-500 mb-4">
          <button onClick={() => router.push("/services")} className="hover:underline">Services</button>
          {" > "}
          {category && (
            <>
              <button onClick={() => router.push(`/services?category=${service.category}`)} className="hover:underline">{category.name}</button>
              {" > "}
            </>
          )}
          <span className="text-gray-700">{service.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left column - Service details */}
          <div className="lg:col-span-2">
            {/* Image carousel */}
            <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
              {service.media_urls && service.media_urls.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {service.media_urls.map((url, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-[250px] sm:h-[400px] w-full">
                          <img 
                            src={url} 
                            alt={`${service.title} - Image ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {service.media_urls.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center text-gray-400">
                  No Images Available
                </div>
              )}
            </div>

            {/* Service title and provider */}
            <div className="mb-5 md:mb-6 flex flex-col gap-y-2 ">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl sm:tex-3xl font-bold text-gray-900">{service.title}</h1>
                <Badge className="bg-sm-red text-white text-[13px] sm:text-lg  px-3 py-1.5 ">
                  {service.price?.startsWith('₹') ? service.price : `₹${service.price}`}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                {category && (
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    {category.name}
                  </Badge>
                )}
                
                {service.duration && (
                  <div className="flex items-center text-gray-700">
                    <Clock size={16} className="mr-1 text-sm-red" />
                    <span>{service.duration}</span>
                  </div>
                )}
                
                {service.location && (
                  <div className="flex items-center text-gray-700">
                    <MapPin size={16} className="mr-1 text-sm-red" />
                    <span>{service.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tabs for description and details */}
            <Tabs defaultValue="description" className="mb-0 md:mb-8">
              <TabsList className="mb-0 md:mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="prose max-w-none px-2">
                <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
              </TabsContent>
              
              <TabsContent value="details">
                <div className="space-y-4 px-4">
                  {service.availability && (
                    <div className="flex gap-2">
                      <div className="w-1/4 font-medium text-gray-700">Availability:</div>
                      <div className="w-3/4 text-gray-600">{service.availability && (
  <div className="space-y-1 text-sm text-gray-600">
    {Object.entries(service.availability).map(([day, time]: any) => (
      <div key={day} className="flex items-center">
        <CalendarIcon size={16} className="mr-2 text-gray-500" />
        <span className="capitalize">
          {day}: {time.start} - {time.end}
        </span>
      </div>
    ))}
  </div>
)}</div>
                    </div>
                  )}
                  
                  {service.duration && (
                    <div className="flex gap-2">
                      <div className="w-1/4 font-medium text-gray-700">Duration:</div>
                      <div className="w-3/4 text-gray-600">{service.duration}</div>
                    </div>
                  )}
                  
                  {service.location && (
                    <div className="flex gap-2">
                      <div className="w-1/4 font-medium text-gray-700">Location:</div>
                      <div className="w-3/4 text-gray-600">{service.location}</div>
                    </div>
                  )}
                  
                  {service.contact && (
                    <div className="flex gap-2">
                      <div className="w-1/4 font-medium text-gray-700">Contact:</div>
                      <div className="w-3/4 text-gray-600">{service.contact}</div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="text-center py-8">
                  <p className="text-gray-600">No reviews yet for this service.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - Provider info and booking */}
          <div>
            {/* Service provider card */}
            <Card className="mb-6 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Service Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-gray-200">
                    <AvatarImage 
                      src={service.profile?.avatar_url || `https://avatars.dicebear.com/api/initials/${service.profile?.username || 'u'}.svg`} 
                      alt={service.profile?.full_name || service.profile?.username || 'Service Provider'} 
                    />
                    <AvatarFallback>
                      {(service.profile?.full_name?.[0] || service.profile?.username?.[0] || 'S').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-lg">
                      {service.profile?.full_name || service.profile?.username || 'Service Provider'}
                    </div>
                    {service.profile?.username && (
                      <div className="text-sm text-gray-500">@{service.profile.username}</div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-medium">Response Rate</div>
                    <div className="text-xl font-bold text-sm-red">98%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Rating</div>
                    <div className="flex items-center justify-center">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold ml-1">4.8</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Services</div>
                    <div className="text-xl font-bold">12+</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-center space-x-2">
                  <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => router.push(`/profile/${service.profile?.id}`)}
                 >
                    <User size={16} className="mr-1" /> View Profile
                  </Button>
                  
                  {service.contact && (
  <a href={`tel:${service.contact}`}>
    <Button variant="outline" size="sm">
      <Phone size={16} className="mr-1" /> Call
    </Button>
  </a>
)}
                </div>
              </CardContent>
            </Card>
            
            {/* Booking Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Book this Service</CardTitle>
                <CardDescription>
                  {service.price?.startsWith('₹') ? service.price : `₹${service.price}`}
                  {service.duration && ` · ${service.duration}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-sm-red hover:bg-sm-red-light">Book Now</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] p-5">
                    <DialogHeader>
                      <DialogTitle>Book Service</DialogTitle>
                      <DialogDescription>
                        Select your preferred date and time for {service.title}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Select Date</h4>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              initialFocus
                              disabled={(date) => 
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                date > new Date(new Date().setMonth(new Date().getMonth() + 2))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Select Time</h4>
                        <div className="grid grid-cols-3 gap-2 w-full">
                          
                          {filteredTimes.length ? filteredTimes.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => setSelectedTime(time)}
                              className={`${
                                selectedTime === time ? "bg-sm-red text-white" : ""
                              }`}
                            >
                              {time}
                            </Button>
                          )):<p className="col-span-3 text-center">No slots available</p>}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Additional Notes</h4>
                        <Textarea
                          placeholder="Any specific requirements..."
                          value={bookingNote}
                          onChange={(e) => setBookingNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleBookingSubmit}
                        disabled={!selectedDate || !selectedTime || isSubmitting}
                        className="bg-sm-red hover:bg-sm-red-light"
                      >
                        {isSubmitting ? "Processing..." : "Confirm Booking"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Check size={16} className="mr-2 text-green-500" />
                    Instant booking confirmation
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check size={16} className="mr-2 text-green-500" />
                    Flexible rescheduling options
                  </div>
                 {service.availability && (
  <div className="space-y-1 text-sm text-gray-600">
    {Object.entries(service.availability).map(([day, time]: any) => (
      <div key={day} className="flex items-center">
        <CalendarIcon size={16} className="mr-2 text-gray-500" />
        <span className="capitalize">
          {day}: {time.start} - {time.end}
        </span>
      </div>
    ))}
  </div>
)}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between px-3 border-t py-3">
                <Button variant="ghost" size="sm">
                  <Heart size={16} className="mr-1" /> Save
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare size={16} className="mr-1" /> Ask Question
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetail;


// Time slots used for booking, should match the admin AvailabilitySelector options
const availableTimes = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
];

function filterAvailableTimes(
  availability: Record<string, { start?: string; end?: string }> | null | undefined,
  selectedDate: Date | null | undefined
): string[] {
  if (!selectedDate) return [];

  const date = new Date(selectedDate);

  // 1. Get selected day's abbreviation (e.g. "Mon")
  const day = date.toLocaleDateString("en-IN", { weekday: "short" });

  // 2. Determine if the selected date is today
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // 3. Get availability for that day
  if (!availability) return [];
  const slot = availability[day];
  if (!slot) return [];

  // 4. Convert time string to minutes
  const toMinutes = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const startMins = slot.start ? toMinutes(slot.start) : 0;
  const endMins = slot.end ? toMinutes(slot.end) : 1440;

  // 5. Filter time slots
  return availableTimes.filter((timeStr) => {
    const timeMins = toMinutes(timeStr);

    if (isToday && timeMins <= nowMinutes) return false;
    return timeMins >= startMins && timeMins < endMins; // exclude `end`
  });
}






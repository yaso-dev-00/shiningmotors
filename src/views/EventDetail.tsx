"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tab } from "@headlessui/react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  getEventById,
  checkRegistrationStatus,
  registerForEvent,
} from "@/integrations/supabase/modules/eventAppPage";
import EventDetail from "@/components/events/EventDetail";
import EventRegistrationForm from "@/components/events/EventRegistrationForm";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Share2,
  Ticket,
  Users,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { EventShareModal } from "@/components/events/EventShareModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

 const EventDetailPage = () => {
   const params = useParams();
   const id = (params?.id as string) ?? "";
  const [isRegistering, setIsRegistering] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const [registrationData, setRegistrationData] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch event details
  const {
    data: event,
    isLoading,
    error,
    refetch: refetchEventDetails,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => (id ? getEventById(id) : null),
    enabled: !!id,
  });

  // Check registration status if user is logged in
  const { data: registrationStatus, refetch: refetchRegistrationStatus } =
    useQuery({
      queryKey: ["eventRegistration", id, user?.id],
      queryFn: () =>
        id && user?.id ? checkRegistrationStatus(id, user.id) : null,
      enabled: !!id && !!user?.id,
    });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="container py-6 md:py-12">
          <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p>Sorry, we couldn't find the event you're looking for.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleRegistrationComplete = async (registrationData: any) => {
    try {
      if (!user || !id) return;

      toast({
        title: "Registration submitted",
        description: "Processing your registration...",
      });

      // If this is a paid event, show the payment modal
      if (event.fee_amount && event.fee_amount > 0) {
        setShowPaymentModal(true);
        setRegistrationData(registrationData);
      } else {
        // If free event, complete registration directly
        await registerForEvent(id, user.id, registrationData);
        toast({
          title: "Registration successful",
          description: "You have been registered for this event.",
        });
        await refetchRegistrationStatus();

        refetchEventDetails();
      }
      setIsRegistering(false);
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        title: "Registration failed",
        description: "There was an error processing your registration.",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    console.log(registrationStatus);
    if (!user || !id || registrationStatus?.isRegistered) return;
    setIsProcessingPayment(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await registerForEvent(id, user.id, registrationData);
      // Update registration with payment info
      // In a real app, this would involve Stripe or another payment processor
      // For now, we're just simulating a successful payment

      toast({
        title: "Payment successful",
        description: "Thank you for your payment.",
      });

      await refetchRegistrationStatus();
      setShowPaymentModal(false);
      refetchEventDetails();
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const isEventPast = event.end_date
    ? new Date(event.end_date) < new Date()
    : event.start_date
    ? new Date(event.start_date) < new Date()
    : false;

  const canRegister =
    !isEventPast &&
    event.registration_required &&
    !registrationStatus?.isRegistered &&
    user?.id;

  const registrationOpen = event.registration_start_date
    ? new Date(event.registration_start_date) <= new Date()
    : true;

  const registrationClosed = event.registration_end_date
    ? new Date(event.registration_end_date) < new Date()
    : false;

  return (
    <Layout>
      <div className="bg-white pb-3 md:pb-16">
        {/* Hero Banner */}
        <div className="relative h-[400px] lg:h-[500px] w-full mb-2 md:mb-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                event.banner_image_url || "/placeholder.svg"
              })`,
              backgroundSize: "cover",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30" />

          <div className="container h-full flex items-end pb-8 relative z-10">
            <div className="text-white">
              <div className="flex flex-wrap gap-2  mb-3">
                <Badge className="bg-red-600 p-2">{event.category}</Badge>
                {isEventPast && (
                  <Badge
                    variant="outline"
                    className="border-gray-400 p-2 text-gray-100"
                  >
                    Past Event
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {event.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="container max-[769px]:px-3 max-[769px]:py-4">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <Tab.Group>
                <Tab.List className="flex space-x-1 border-b mb-4 md:mb-6">
                  <Tab
                    className={({ selected }) =>
                      `py-2 px-4 text-sm font-medium border-b-2 ${
                        selected
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`
                    }
                  >
                    Event Details
                  </Tab>

                  {event.gallery_urls && event.gallery_urls.length > 0 && (
                    <Tab
                      className={({ selected }) =>
                        `py-2 px-4 text-sm font-medium border-b-2 ${
                          selected
                            ? "border-red-600 text-red-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`
                      }
                    >
                      Gallery
                    </Tab>
                  )}
                </Tab.List>

                <Tab.Panels>
                  <Tab.Panel>
                    <EventDetail event={event} />
                  </Tab.Panel>

                  {event.gallery_urls && event.gallery_urls.length > 0 && (
                    <Tab.Panel>
                      <h2 className="text-2xl font-semibold mb-4">
                        Event Gallery
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {event.gallery_urls.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="cursor-pointer overflow-hidden rounded-md shadow-sm hover:shadow-md transition-shadow"
                          >
                            <img
                              src={imageUrl}
                              alt={`Event image ${index + 1}`}
                              className="w-full h-48 object-cover transform hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    </Tab.Panel>
                  )}
                </Tab.Panels>
              </Tab.Group>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              {/* Quick Info Card */}
              <div className="bg-[rgb(250,250,250)] p-5 md:p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  Event Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 mr-3 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-gray-600">
                        {new Date(event.start_date || "").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        {event.start_time &&
                          `, ${event.start_time.substring(0, 5)}`}
                      </p>
                      {event.end_date &&
                        event.end_date !== event.start_date && (
                          <p className="text-gray-600">
                            to{" "}
                            {new Date(event.end_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                            {event.end_time &&
                              `, ${event.end_time.substring(0, 5)}`}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">
                        {event.venue || "Venue TBA"}
                      </p>
                      <p className="text-gray-600">
                        {[event.city, event.state, event.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  {event.registration_required && (
                    <div className="flex items-start">
                      <Users className="w-5 h-5 mr-3 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Registration</p>
                        <p className="text-gray-600">
                          {event.fee_amount && event.fee_amount > 0
                            ? `${event.fee_currency} ${event.fee_amount}`
                            : "Free entry"}
                        </p>
                        {event.max_participants && (
                          <p className="text-gray-600">
                            Limited to {event.max_participants} participants
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {event.registration_required && (
                    <>
                      {registrationStatus?.isRegistered ? (
                        <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center">
                          <Ticket className="w-5 h-5 mr-2" />
                          <p className="font-medium">You're registered!</p>
                        </div>
                      ) : (
                        <>
                          {!isRegistering && (
                            <Button
                              className={`w-full text-[15px] ${
                                canRegister
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-gray-800"
                              }`}
                              onClick={() => {
                                if (!user) {
                                  toast({
                                    title: "Login required",
                                    description:
                                      "Please login to register for this event.",
                                  });
                                  return;
                                }
                                if (canRegister) {
                                  setIsRegistering(true);
                                }
                              }}
                              disabled={
                                !canRegister ||
                                isEventPast ||
                                !registrationOpen ||
                                registrationClosed
                              }
                            >
                              {isEventPast
                                ? "Event Ended"
                                : !registrationOpen
                                ? "Registration Opens Soon"
                                : registrationClosed
                                ? "Registration Closed"
                                : "Register Now"}
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={handleShareClick}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              </div>

              {/* Registration Form */}
              {isRegistering && user && canRegister && (
                <EventRegistrationForm
                  event={{
                    id: event.id,
                    title: event.title,
                    fee_amount: event.fee_amount ?? undefined,
                    fee_currency: event.fee_currency ?? undefined,
                    registration_required: event.registration_required ?? undefined,
                  }}
                  onSuccess={() => handleRegistrationComplete({})}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Share Modal */}
      <EventShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        event={event}
      />

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md px-3">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Please provide your payment information to complete registration
              for "{event.title}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
              <p className="font-medium">
                Amount: {event.fee_currency} {event.fee_amount}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="card-number" className="text-sm font-medium">
                Card Number
              </label>
              <Input id="card-number" placeholder="1234 5678 9012 3456" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="expiry" className="text-sm font-medium">
                  Expiry Date
                </label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>

              <div className="space-y-2">
                <label htmlFor="cvc" className="text-sm font-medium">
                  CVC
                </label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name on Card
              </label>
              <Input id="name" placeholder="John Doe" />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="bg-red-600 hover:bg-red-700 w-full"
              onClick={handlePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {event.fee_currency} {event.fee_amount}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventDetailPage;

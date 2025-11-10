"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, ArrowLeft, Heart, Share2, MessageSquare,
  Calendar, Gauge, Fuel, Car, MapPin, Clock, DollarSign,
  CheckIcon,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ExtendedVehicle } from "@/integrations/supabase/modules/vehicles";

interface VehicleWithProfile extends ExtendedVehicle {
  profiles?: {
    id?: string;
    username?: string;
    avatar_url?: string;
    full_name?: string;
  },
  seats: number
}

const VehicleDetail = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [vehicle, setVehicle] = useState<VehicleWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  useEffect(() => {
    if (!id) return;

    const fetchVehicle = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("vehicles")
          .select(`
            *,
            profiles:seller_id (
              id,
              avatar_url,
              username,
              full_name
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        const vehicleData: VehicleWithProfile = {
          ...data,
          // status: "available",
          // color: data.condition,
          // fuel_type: null,
          // transmission: null,
          features: [],
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          seats: data.seats ?? 4,
          fuel_type: data.fuel_type ?? "",
          status: data.status ?? "available"
        };

        setVehicle(vehicleData);
        if (vehicleData.images && vehicleData.images.length > 0) {
          setSelectedImage(vehicleData.images[0]);
        }
      } catch (error) {
        console.error("Error fetching vehicle:", error);
        toast({
          title: "Error",
          description: "Failed to load vehicle details",
          variant: "destructive",
        });
         router.push("/vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const toggleWishlist = () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    setIsWishlisted(!isWishlisted);

    toast({
      description: isWishlisted
        ? `${vehicle?.make} ${vehicle?.model} removed from your wishlist`
        : `${vehicle?.make} ${vehicle?.model} added to your wishlist`,
    });
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${vehicle?.make} ${vehicle?.model} - Shining Motors`,
        url: window.location.href,
      });
    } else {
      if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
      }
      toast({
        description: "Link copied to clipboard",
      });
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    toast({
      description: "Message functionality coming soon",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-sm-red" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <h2 className="mb-2 text-2xl font-bold">Vehicle Not Found</h2>
            <p className="mb-6 text-gray-500">The vehicle you're looking for doesn't exist or has been removed.</p>
             <Button onClick={() => router.push("/vehicles") }>
              Back to Vehicles
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(vehicle.price);
  const listedDate = new Date(vehicle.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const statusColor=vehicle.status.toLowerCase()=="available"?"bg-green-600":vehicle.status.toLowerCase()=="reserved"?"bg-blue-700":'bg-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-2">
        <Button
          variant="ghost"
          className="mb-4 flex items-center p-[0px]"
           onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </Button>

        <div className="flex flex-col md:flex-row  gap-3 md:gap-8">
          <div className="w-full md:w-3/5 space-y-4">
            <div className="rounded-lg bg-white overflow-hidden shadow-md aspect-w-16 h-[250px] sm:h-[400px]">
              <img
                src={selectedImage || vehicle.images?.[0] || "https://images.unsplash.com/photo-1550355291-bbee04a92027"}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>

            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex overflow-scroll h-26  p-2 scrollbar-hide">
                {vehicle.images.map((image, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer rounded-md flex-shrink-0 basis-1/4 border-[3px] h-24 border-spacing-9 ${selectedImage === image ? "border-sm-red" : "border-transparent"
                      }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${vehicle.make} ${vehicle.model} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-2/5 space-y-3 md:space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                {vehicle.title?<>{vehicle.title} </>: <>{vehicle.year} {vehicle.make} {vehicle.model}</>}
                </h1>
                <Button
                  variant="outline"
                  size="icon"
                  className={isWishlisted ? "text-red-500" : ""}
                  onClick={() => toggleWishlist()}
                >
                  <Heart className={isWishlisted ? "fill-current" : ""} size={20} />
                </Button>
              </div>
              <Badge className={"mt-2 "+statusColor}>{vehicle.status?.toUpperCase()}</Badge>
            </div>

            <div className="text-xl sm:text-3xl font-bold text-sm-red">
              {formattedPrice}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-500" size={18} />
                <span>{vehicle.year}</span>
              </div>

              {vehicle.mileage && (
                <div className="flex items-center gap-2">
                  <Gauge className="text-gray-500" size={18} />
                  <span>{new Intl.NumberFormat('en-US').format(vehicle.mileage)} mi</span>
                </div>
              )}

              {vehicle.fuel_type && (
                <div className="flex items-center gap-2">
                  <Fuel className="text-gray-500" size={18} />
                  <span>{vehicle.fuel_type}</span>
                </div>
              )}

              {vehicle.transmission && (
                <div className="flex items-center gap-2">
                  <Car className="text-gray-500" size={18} />
                  <span>{vehicle.transmission}</span>
                </div>
              )}

              {/* <div className="flex items-center gap-2">
                <MapPin className="text-gray-500" size={18} />
                <span>Los Angeles, CA</span>
              </div> */}

              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-500" />
                <span>{vehicle.seats} seats</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-gray-500" size={18} />
                <span>Listed on {listedDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {vehicle.profiles?.avatar_url ? (
                    <AvatarImage src={vehicle.profiles.avatar_url} alt={vehicle.profiles?.full_name || "User"} />
                  ) : (
                    <AvatarFallback>
                      {((vehicle.profiles?.full_name?.[0]) || (vehicle.profiles?.username?.[0]) || "S").toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <span className="font-medium">{vehicle.profiles?.full_name || vehicle.profiles?.username || "Seller"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 bg-sm-red hover:bg-sm-red-light" onClick={() => handleContact()}>
                <MessageSquare className="mr-2 h-4 w-4" /> Contact Seller
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleShare()}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 text-lg font-medium">Price Insights</h3>
                <div className="flex items-center justify-between">
                  <span>Market average</span>
                  <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
  .format(Math.round(vehicle.price * 1.05))}</span>
                </div>
                <div className="flex items-center justify-between text-sm-red">
                  <span>This price</span>
                  <span className="font-medium">{formattedPrice}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <DollarSign size={14} />
                  <span>Priced {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
  .format(Math.round(vehicle.price * 0.05))} below market</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sm-red bg-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sm-red bg-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Features
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-sm-red bg-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Specifications
              </TabsTrigger>
            </TabsList>

            <CardContent className="pt-6">
              <TabsContent value="description" className="mt-0">
                <div className="prose max-w-none">
                  <p>{vehicle.description || "No description provided for this vehicle."}</p>
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-0">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium">Vehicle Features</h3>
                  {vehicle.features && vehicle.features.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {vehicle.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sm-red text-white">
                            <CheckIcon size={12} />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No specific features listed for this vehicle.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-0">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium">Vehicle Specifications</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="font-medium">Make</div>
                      <div className="text-gray-600">{vehicle.make}</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="font-medium">Model</div>
                      <div className="text-gray-600">{vehicle.model}</div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="font-medium">Year</div>
                      <div className="text-gray-600">{vehicle.year}</div>
                    </div>
                    {vehicle.mileage !== null && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="font-medium">Mileage</div>
                        <div className="text-gray-600">{new Intl.NumberFormat('en-US').format(vehicle.mileage)} miles</div>
                      </div>
                    )}
                    {vehicle.color && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="font-medium">Color</div>
                        <div className="text-gray-600">{vehicle.color}</div>
                      </div>
                    )}
                    {vehicle.condition && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="font-medium">Condition</div>
                        <div className="text-gray-600">{vehicle.condition}</div>
                      </div>
                    )}
                    {vehicle.fuel_type && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="font-medium">Fuel Type</div>
                        <div className="text-gray-600">{vehicle.fuel_type}</div>
                      </div>
                    )}
                    {vehicle.transmission && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="font-medium">Transmission</div>
                        <div className="text-gray-600">{vehicle.transmission}</div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default VehicleDetail;

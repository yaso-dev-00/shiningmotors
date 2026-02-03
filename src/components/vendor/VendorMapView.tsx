"use client";
import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Search, Filter, X, Star, Phone, Mail, CheckCircle, Navigation } from "lucide-react";
import { sampleVendors, VendorLocation, cityCoordinates } from "@/lib/data/sampleVendors";
import { motion, AnimatePresence } from "framer-motion";

interface VendorMapViewProps {
  onVendorSelect?: (vendor: VendorLocation) => void;
}

export const VendorMapView = ({ onVendorSelect }: VendorMapViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorLocation | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // India center
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return sampleVendors.filter((vendor) => {
      const matchesSearch =
        searchQuery === "" ||
        vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = selectedCity === "all" || vendor.city === selectedCity;
      const matchesCategory =
        selectedCategory === "all" || vendor.categories.includes(selectedCategory);

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [searchQuery, selectedCity, selectedCategory]);

  // Get unique cities and categories
  const cities = useMemo(
    () => Array.from(new Set(sampleVendors.map((v) => v.city))).sort(),
    []
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(sampleVendors.flatMap((v) => v.categories))
      ).sort(),
    []
  );

  // Handle city selection
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (city !== "all" && cityCoordinates[city]) {
      setMapCenter(cityCoordinates[city]);
    }
  };

  // Calculate distance (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Sort vendors by distance if user location is available
  const sortedVendors = useMemo(() => {
    if (!userLocation) return filteredVendors;

    return [...filteredVendors].sort((a, b) => {
      const distA = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }, [filteredVendors, userLocation]);

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      shop: "bg-blue-500",
      services: "bg-green-500",
      vehicles: "bg-red-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4 z-10">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Find Vendors Near You
          </h1>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search vendors, cities, or addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Use My Location
            </Button>
            {userLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 relative bg-gray-200">
          {/* Google Maps Embed - Replace with your API key */}
          <iframe
            src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&center=${mapCenter.lat},${mapCenter.lng}&zoom=6`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          />

          {/* Custom Markers Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {filteredVendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${((vendor.longitude + 180) / 360) * 100}%`,
                  top: `${((90 - vendor.latitude) / 180) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
                onClick={() => {
                  setSelectedVendor(vendor);
                  onVendorSelect?.(vendor);
                }}
              >
                <div className="relative">
                  <div
                    className={`w-6 h-6 rounded-full ${getCategoryColor(
                      vendor.categories[0]
                    )} shadow-lg border-2 border-white flex items-center justify-center`}
                  >
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  {selectedVendor?.id === vendor.id && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-4 h-4 bg-sm-red rounded-full border-2 border-white"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* User Location Marker */}
          {userLocation && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${((userLocation.lng + 180) / 360) * 100}%`,
                top: `${((90 - userLocation.lat) / 180) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
                <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75" />
              </div>
            </div>
          )}
        </div>

        {/* Vendor List Sidebar */}
        <div className="w-96 bg-white border-l overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                Vendors ({filteredVendors.length})
              </h2>
              {userLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserLocation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {userLocation && (
              <p className="text-xs text-gray-500">
                Sorted by distance from your location
              </p>
            )}
          </div>

          <div className="p-4 space-y-4">
            <AnimatePresence>
              {sortedVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedVendor?.id === vendor.id
                        ? "ring-2 ring-sm-red border-sm-red"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      onVendorSelect?.(vendor);
                      setMapCenter({
                        lat: vendor.latitude,
                        lng: vendor.longitude,
                      });
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {vendor.businessName}
                            </h3>
                            {vendor.isVerified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vendor.city}, {vendor.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {vendor.rating}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({vendor.reviewCount})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {vendor.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="text-xs"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 mb-2">
                        {vendor.address}
                      </p>

                      {userLocation && (
                        <p className="text-xs text-sm-red font-medium">
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            vendor.latitude,
                            vendor.longitude
                          ).toFixed(1)}{" "}
                          km away
                        </p>
                      )}

                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${vendor.phone}`);
                          }}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${vendor.email}`);
                          }}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredVendors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No vendors found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      <AnimatePresence>
        {selectedVendor && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVendor(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">
                        {selectedVendor.businessName}
                      </CardTitle>
                      {selectedVendor.isVerified && (
                        <Badge className="bg-blue-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {selectedVendor.rating}
                        </span>
                        <span>({selectedVendor.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedVendor.city}, {selectedVendor.state}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedVendor(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Address</h4>
                    <p className="text-gray-600">{selectedVendor.address}</p>
                    {selectedVendor.branchName && (
                      <p className="text-sm text-gray-500 mt-1">
                        Branch: {selectedVendor.branchName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Contact</h4>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedVendor.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedVendor.email}
                        </p>
                      </div>
                    </div>

                    {userLocation && (
                      <div>
                        <h4 className="font-semibold mb-2">Distance</h4>
                        <p className="text-2xl font-bold text-sm-red">
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedVendor.latitude,
                            selectedVendor.longitude
                          ).toFixed(1)}{" "}
                          <span className="text-base font-normal">km</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 bg-sm-red hover:bg-sm-red-light"
                      onClick={() => {
                        window.open(`tel:${selectedVendor.phone}`);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${selectedVendor.latitude},${selectedVendor.longitude}`,
                          "_blank"
                        );
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


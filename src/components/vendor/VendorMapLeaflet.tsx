"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  MapPin,
  Search,
  X,
  Star,
  Phone,
  Mail,
  CheckCircle,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Filter,
} from "lucide-react";
import { sampleVendors, VendorLocation, cityCoordinates } from "@/lib/data/sampleVendors";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import Leaflet to avoid SSR issues
const SafeMapContainer = dynamic(
  () => import("./SafeMapContainer").then((mod) => ({ default: mod.SafeMapContainer })),
  { ssr: false }
);
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface VendorMapLeafletProps {
  onVendorSelect?: (vendor: VendorLocation) => void;
}

// Component to handle map center updates
function MapCenterHandler({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => {
    if (map && map.getCenter) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      // Only update if center or zoom actually changed
      if (
        Math.abs(currentCenter.lat - center[0]) > 0.0001 ||
        Math.abs(currentCenter.lng - center[1]) > 0.0001 ||
        currentZoom !== zoom
      ) {
        map.setView(center, zoom, { animate: true });
      }
    }
  }, [map, center, zoom]);
  return null;
}

export const VendorMapLeaflet = ({ onVendorSelect }: VendorMapLeafletProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorLocation | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [zoom, setZoom] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const containerIdRef = useRef(`map-container-${Date.now()}-${Math.random()}`);
  const mapRenderedRef = useRef(false);

  // Load Leaflet CSS and fix default icon issue
  useEffect(() => {
    if (typeof window !== "undefined" && !mapLoaded) {
      // Check if CSS is already loaded
      const existingLink = document.querySelector('link[href*="leaflet"]');
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      // Fix for default marker icon issue
      const L = require("leaflet");
      if (L.Icon && L.Icon.Default) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
      }
      setMapLoaded(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Clean up any existing map before rendering
        if (mapContainerRef.current) {
          const container = mapContainerRef.current;
          if ((container as any)._leaflet_id) {
            try {
              const L = require("leaflet");
              // Get the map instance from Leaflet's internal registry
              const mapId = (container as any)._leaflet_id;
              const existingMap = (L as any).map._leaflet_id 
                ? (L as any).map 
                : (L.Map && (L.Map as any).get && (L.Map as any).get(container))
                ? (L.Map as any).get(container)
                : null;
              
              if (existingMap && typeof existingMap.remove === 'function') {
                existingMap.remove();
              }
              // Clear the leaflet ID
              delete (container as any)._leaflet_id;
            } catch (e) {
              // Ignore cleanup errors
              console.warn("Error cleaning up map:", e);
            }
          }
        }
        setShouldRenderMap(true);
      }, 200);
    }

    // Cleanup function to prevent double initialization
    return () => {
      if (typeof window !== "undefined" && mapContainerRef.current && mapRenderedRef.current) {
        const container = mapContainerRef.current;
        // Remove any existing Leaflet map instance
        if ((container as any)._leaflet_id) {
          try {
            const L = require("leaflet");
            const existingMap = (L as any).map._leaflet_id 
              ? (L as any).map 
              : (L.Map && (L.Map as any).get && (L.Map as any).get(container))
              ? (L.Map as any).get(container)
              : null;
            
            if (existingMap && typeof existingMap.remove === 'function') {
              existingMap.remove();
            }
            delete (container as any)._leaflet_id;
            mapRenderedRef.current = false;
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    };
  }, [mapLoaded]);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          setMapCenter(location);
          setZoom(12);
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
      setMapCenter([cityCoordinates[city].lat, cityCoordinates[city].lng]);
      setZoom(11);
    } else {
      setMapCenter([20.5937, 78.9629]);
      setZoom(6);
    }
  };

  // Calculate distance
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
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

  // Sort vendors by distance
  const sortedVendors = useMemo(() => {
    if (!userLocation) return filteredVendors;

    return [...filteredVendors].sort((a, b) => {
      const distA = calculateDistance(
        userLocation[0],
        userLocation[1],
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        userLocation[0],
        userLocation[1],
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }, [filteredVendors, userLocation]);

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      shop: "#3b82f6",
      services: "#10b981",
      vehicles: "#ef4444",
    };
    return colors[category] || "#6b7280";
  };

  // Create custom icon
  const createCustomIcon = useCallback((color: string) => {
    if (typeof window === "undefined") return null;
    const L = require("leaflet");
    
    return L.divIcon({
      className: "custom-vendor-marker",
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 18px;
            font-weight: bold;
          ">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!mapLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sm-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4 z-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Find Vendors Near You
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-2"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden md:inline">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden md:inline">Fullscreen</span>
                  </>
                )}
              </Button>
            </div>
          </div>

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
            <div className="flex gap-1 ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(zoom + 1, 18))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(zoom - 1, 3))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leaflet Map */}
        <div 
          ref={mapContainerRef}
          className="flex-1 relative" 
          id={containerIdRef.current}
          style={{ height: "100%", width: "100%" }}
        >
          {typeof window !== "undefined" && shouldRenderMap && !mapRenderedRef.current && (
            <MapContainer
              key={containerIdRef.current}
              center={mapCenter}
              zoom={zoom}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              zoomControl={true}
              className="z-0"
              whenReady={() => {
                mapRenderedRef.current = true;
              }}
            >
              <MapCenterHandler center={mapCenter} zoom={zoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Vendor Markers */}
              {filteredVendors.map((vendor) => {
                const icon = createCustomIcon(
                  getCategoryColor(vendor.categories[0])
                );
                if (!icon) return null;
                
                return (
                  <Marker
                    key={vendor.id}
                    position={[vendor.latitude, vendor.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        setSelectedVendor(vendor);
                        onVendorSelect?.(vendor);
                        setMapCenter([vendor.latitude, vendor.longitude]);
                        setZoom(14);
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-sm mb-1">
                          {vendor.businessName}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {vendor.city}, {vendor.state}
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">
                            {vendor.rating} ({vendor.reviewCount})
                          </span>
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
                        <Button
                          size="sm"
                          className="w-full text-xs bg-sm-red hover:bg-sm-red-light"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setMapCenter([vendor.latitude, vendor.longitude]);
                            setZoom(14);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* User Location Marker */}
              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>

        {/* Vendor List Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-96 bg-white border-l overflow-y-auto z-10 shadow-lg"
            >
              <div className="p-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">
                    Vendors ({filteredVendors.length})
                  </h2>
                  <div className="flex gap-2">
                    {userLocation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserLocation(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSidebar(false)}
                      className="md:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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
                          setMapCenter([vendor.latitude, vendor.longitude]);
                          setZoom(14);
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
                                userLocation[0],
                                userLocation[1],
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
            </motion.div>
          )}
        </AnimatePresence>
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
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold">
                        {selectedVendor.businessName}
                      </h2>
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
              </div>

              <div className="p-6 space-y-4">
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
                          userLocation[0],
                          userLocation[1],
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaflet CSS Fix */}
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          z-index: 1;
        }
        .custom-vendor-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  ChevronUp,
} from "lucide-react";
import { sampleVendors, VendorLocation, cityCoordinates, countryCoordinates } from "@/lib/data/sampleVendors";
import { motion, AnimatePresence } from "framer-motion";

interface VendorMapManualProps {
  onVendorSelect?: (vendor: VendorLocation) => void;
}

export const VendorMapManual = ({ onVendorSelect }: VendorMapManualProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorLocation | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [zoom, setZoom] = useState(5); // Lower zoom to show more of India
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Hidden by default on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // Collapsible filters
  const [mapReady, setMapReady] = useState(false);
  const [cssLoaded, setCssLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const cityMarkersRef = useRef<any[]>([]);
  const countryChangeRef = useRef<string>("");
  const isCountryChangingRef = useRef<boolean>(false);
  const isUserInteractingRef = useRef<boolean>(false);

  // Detect mobile/desktop and set sidebar visibility
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      // On desktop, always show sidebar
      if (!mobile) {
        setShowSidebar(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (isMobile && showSidebar) {
      // Store current scroll position
      const scrollY = window.scrollY;
      // Prevent body scroll
      document.body.classList.add('bottom-sheet-open');
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        // Restore body scroll
        document.body.classList.remove('bottom-sheet-open');
        const savedScrollY = document.body.style.top;
        document.body.style.top = '';
        if (savedScrollY) {
          window.scrollTo(0, parseInt(savedScrollY.replace('-', '')) || 0);
        }
      };
    }
  }, [isMobile, showSidebar]);

  // Load Leaflet CSS first
  useEffect(() => {
    if (typeof window === "undefined" || cssLoaded) return;

    // Check if CSS is already loaded
    const existingLink = document.querySelector('link[href*="leaflet"]');
    if (existingLink) {
      setCssLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    link.onload = () => {
      setCssLoaded(true);
    };
    link.onerror = () => {
      console.error("Failed to load Leaflet CSS");
      setCssLoaded(true); // Continue anyway
    };
    document.head.appendChild(link);

    return () => {
      // Don't remove the link on cleanup as it might be used elsewhere
    };
  }, [cssLoaded]);

  // Initialize map manually
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current || !cssLoaded) {
      return;
    }

    const initMap = async () => {
      try {
        const L = await import("leaflet");

      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Check if container already has a map
      const container = mapContainerRef.current;
      if (!container || (container as any)._leaflet_id) {
        return;
      }

      // Create map with proper zoom constraints for India
      const map = L.map(container, {
        center: mapCenter,
        zoom: zoom,
        zoomControl: true,
        minZoom: 1, // Allow zooming out to see entire world/India
        maxZoom: 18,
        worldCopyJump: true, // Allow infinite horizontal panning
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
      
      // Wait for map to be fully ready before marking as ready
      map.whenReady(() => {
        console.log("Map is ready!");
        setMapReady(true); // Mark map as ready after tiles load
      });

      // Add event listeners to detect user interaction
      map.on('dragstart', () => {
        isUserInteractingRef.current = true;
      });
      
      map.on('dragend', () => {
        // Small delay to ensure drag is complete
        setTimeout(() => {
          isUserInteractingRef.current = false;
        }, 100);
      });
      
      map.on('zoomstart', () => {
        isUserInteractingRef.current = true;
      });
      
      map.on('zoomend', () => {
        setTimeout(() => {
          isUserInteractingRef.current = false;
        }, 100);
      });
      
      map.on('movestart', () => {
        isUserInteractingRef.current = true;
      });
      
      map.on('moveend', () => {
        setTimeout(() => {
          isUserInteractingRef.current = false;
        }, 100);
      });
      
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    // Small delay to ensure CSS is applied
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => {
      clearTimeout(timer);
    };

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Clear markers
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
      });
      markersRef.current = [];
      cityMarkersRef.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
      });
      cityMarkersRef.current = [];
    };
  }, [cssLoaded]); // Re-run when CSS is loaded

  // Update map center and zoom
  useEffect(() => {
    // Skip if we're in the middle of a country change or user is interacting
    if (isCountryChangingRef.current || isUserInteractingRef.current) {
      return;
    }
    
    if (mapRef.current && mapReady) {
      // Get current map state
      const currentCenter = mapRef.current.getCenter();
      const currentZoom = mapRef.current.getZoom();
      
      // Calculate distance difference
      const latDiff = Math.abs(currentCenter.lat - mapCenter[0]);
      const lngDiff = Math.abs(currentCenter.lng - mapCenter[1]);
      const centerDiff = latDiff + lngDiff;
      const zoomDiff = Math.abs(currentZoom - zoom);
      
      // Update if center changed significantly (more than 0.05 degrees ~5.5km) or zoom changed by more than 0.5
      if (centerDiff > 0.05 || zoomDiff > 0.5) {
        mapRef.current.setView(mapCenter, zoom, { 
          animate: true,
          duration: 1.0,
          easeLinearity: 0.25
        });
      }
    }
  }, [mapCenter, zoom, mapReady]);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return sampleVendors.filter((vendor) => {
      // Search matching - more comprehensive with multi-word support
      const searchLower = searchQuery.toLowerCase().trim();
      let matchesSearch = true; // Default to true if no search query
      
      if (searchLower !== "") {
        // Split search query into words for better matching
        const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
        
        // Create a searchable text string from all vendor fields
        const searchableText = [
          vendor.businessName,
          vendor.personalName,
          vendor.city,
          vendor.state,
          vendor.country,
          vendor.address,
          vendor.branchName || "",
          ...vendor.categories
        ].join(" ").toLowerCase();

        // Check if all search words are found in the searchable text
        matchesSearch = searchWords.every(word => 
          searchableText.includes(word)
        );
      }

      // Country filter
      const matchesCountry = selectedCountry === "all" || vendor.country === selectedCountry;
      
      // City filter
      const matchesCity = selectedCity === "all" || vendor.city === selectedCity;
      
      // Category filter
      const matchesCategory =
        selectedCategory === "all" || vendor.categories.includes(selectedCategory);

      return matchesSearch && matchesCountry && matchesCity && matchesCategory;
    });
  }, [searchQuery, selectedCountry, selectedCity, selectedCategory]);

  // Add city markers for major cities - ALWAYS show them
  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      console.log("City markers: waiting for map", { mapRef: !!mapRef.current, mapReady });
      return;
    }

    console.log("Adding city markers...");

    function addCityMarkers() {
      if (!mapRef.current) {
        console.log("City markers: map ref not available");
        return;
      }

      const L = require("leaflet");

      // Clear existing city markers
      cityMarkersRef.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
      });
      cityMarkersRef.current = [];

      // Add city markers for ALL major cities
      Object.entries(cityCoordinates).forEach(([cityName, coords]) => {
        // Count vendors in this city from ALL vendors, not just filtered
        const vendorsInCity = sampleVendors.filter(v => v.city === cityName).length;
        
        // Create city marker with label - ALWAYS show major cities
        const cityIcon = L.divIcon({
          className: "city-marker",
          html: `
            <div style="
              background: linear-gradient(135deg, #8B0000 0%, #a80000 100%);
              color: white;
              padding: 10px 16px;
              border-radius: 25px;
              font-weight: 700;
              font-size: 15px;
              box-shadow: 0 4px 15px rgba(139, 0, 0, 0.4);
              border: 3px solid white;
              white-space: nowrap;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">
              <span style="font-size: 18px;">🏙️</span>
              <span>${cityName}</span>
              ${vendorsInCity > 0 ? `<span style="
                background: rgba(255,255,255,0.25);
                padding: 4px 10px;
                border-radius: 15px;
                font-size: 13px;
                margin-left: 6px;
                font-weight: 600;
              ">${vendorsInCity}</span>` : ''}
            </div>
          `,
          iconSize: [null, null],
          iconAnchor: [0, 0],
        });

        const cityMarker = L.marker([coords.lat, coords.lng], { 
          icon: cityIcon,
          zIndexOffset: 1000,
          riseOnHover: true
        })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="min-width: 220px; text-align: center; padding: 8px;">
            <h3 style="font-weight: 700; margin-bottom: 10px; color: #8B0000; font-size: 18px;">${cityName}</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 12px;">
              ${vendorsInCity} vendor${vendorsInCity !== 1 ? 's' : ''} available in this city
            </p>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('city-select', {detail: '${cityName}'}))"
              style="
                width: 100%;
                padding: 10px;
                background: #8B0000;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#a80000'"
              onmouseout="this.style.background='#8B0000'"
            >View Vendors in ${cityName}</button>
          </div>
        `);

        cityMarker.on('click', () => {
          // Find the country for this city from vendor data
          const cityVendor = sampleVendors.find(v => v.city === cityName);
          if (cityVendor) {
            // Apply country filter to match the city
            setSelectedCountry(cityVendor.country);
          }
          // Clear search query to show all vendors from the city
          setSearchQuery("");
          // Apply city filter
          setSelectedCity(cityName);
          // Show filters if collapsed
          setShowFilters(true);
          setMapCenter([coords.lat, coords.lng]);
          setZoom(11);
          // Open sidebar on mobile when clicking "View Vendors"
          if (window.innerWidth < 768) {
            setShowSidebar(true);
          }
          // Scroll to top of sidebar to show filtered results
          setTimeout(() => {
            const sidebarContent = document.querySelector('.sidebar-scrollable');
            if (sidebarContent) {
              sidebarContent.scrollTop = 0;
            }
          }, 200);
        });

        cityMarkersRef.current.push(cityMarker);
      });

      console.log(`Added ${cityMarkersRef.current.length} city markers`);
    }

    addCityMarkers();

    // Listen for city select events from popup
    const handleCitySelect = (e: CustomEvent) => {
      const city = e.detail;
      if (city && cityCoordinates[city]) {
        // Find the country for this city from vendor data
        const cityVendor = sampleVendors.find(v => v.city === city);
        if (cityVendor) {
          // Apply country filter to match the city
          setSelectedCountry(cityVendor.country);
        }
        // Clear search query to show all vendors from the city
        setSearchQuery("");
        // Apply city filter
        setSelectedCity(city);
        // Show filters if collapsed
        setShowFilters(true);
        setMapCenter([cityCoordinates[city].lat, cityCoordinates[city].lng]);
        setZoom(11);
        // Open sidebar on mobile and desktop
        if (window.innerWidth < 768) {
          setShowSidebar(true);
        }
        // Scroll to top of sidebar to show filtered results
        setTimeout(() => {
          const sidebarContent = document.querySelector('.sidebar-scrollable');
          if (sidebarContent) {
            sidebarContent.scrollTop = 0;
          }
        }, 200);
      }
    };

    window.addEventListener('city-select', handleCitySelect as EventListener);
    
    return () => {
      window.removeEventListener('city-select', handleCitySelect as EventListener);
    };
  }, [mapReady]); // Only re-run when map becomes ready

  // Update markers when vendors change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const L = require("leaflet");

    // Clear existing vendor markers
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current = [];

    // Add new vendor markers
    filteredVendors.forEach((vendor) => {
      const color = getCategoryColor(vendor.categories[0]);
      const icon = L.divIcon({
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
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 18px;
            ">📍</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([vendor.latitude, vendor.longitude], { 
        icon,
        zIndexOffset: 500,
        riseOnHover: true // Make marker rise on hover for better visibility
      })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <h3 style="font-weight: 600; margin: 0; font-size: 14px; flex: 1;">${vendor.businessName}</h3>
              ${vendor.isVerified ? '<span style="color: #3b82f6; font-size: 16px;" title="Verified">✓</span>' : ''}
            </div>
            <p style="color: #666; font-size: 11px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              📍 ${vendor.city}, ${vendor.state}
            </p>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
              <span style="color: #fbbf24; font-size: 14px;">★</span>
              <span style="font-size: 12px; font-weight: 500;">${vendor.rating}</span>
              <span style="color: #999; font-size: 11px;">(${vendor.reviewCount} reviews)</span>
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
              ${vendor.categories.map(cat => `
                <span style="
                  background: #f3f4f6;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 10px;
                  color: #374151;
                ">${cat}</span>
              `).join('')}
            </div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('vendor-select', {detail: '${vendor.id}'}))"
              style="
                width: 100%;
                padding: 8px;
                background: #8B0000;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#a80000'"
              onmouseout="this.style.background='#8B0000'"
            >View Details</button>
          </div>
        `, {
          maxWidth: 250,
          className: 'vendor-popup'
        });

      marker.on('click', () => {
        setSelectedVendor(vendor);
        onVendorSelect?.(vendor);
        setMapCenter([vendor.latitude, vendor.longitude]);
        setZoom(14);
      });

      // Also open popup on hover for better UX
      marker.on('mouseover', function(this: L.Marker) {
        this.openPopup();
      });

      markersRef.current.push(marker);
    });

    console.log(`Added ${markersRef.current.length} vendor markers`);

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `
          <div style="
            background-color: #3b82f6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const userMarker = L.marker(userLocation, { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup("<strong>Your Location</strong>");
      markersRef.current.push(userMarker);
    }

    // Listen for vendor select events from popup
    const handleVendorSelect = (e: CustomEvent) => {
      const vendorId = e.detail;
      const vendor = filteredVendors.find(v => v.id === vendorId);
      if (vendor) {
        setSelectedVendor(vendor);
        onVendorSelect?.(vendor);
        setMapCenter([vendor.latitude, vendor.longitude]);
        setZoom(14);
      }
    };

    // Listen for city select events from popup button (duplicate handler - keeping for vendor markers)
    const handleCitySelectFromButton = (e: CustomEvent) => {
      const cityName = e.detail;
      // Find the country for this city from vendor data
      const cityVendor = sampleVendors.find(v => v.city === cityName);
      if (cityVendor) {
        // Apply country filter to match the city
        setSelectedCountry(cityVendor.country);
      }
      // Clear search query to show all vendors from the city
      setSearchQuery("");
      // Apply city filter
      setSelectedCity(cityName);
      // Show filters if collapsed
      setShowFilters(true);
      // Open sidebar on mobile when clicking "View Vendors" button
      if (window.innerWidth < 768) {
        setShowSidebar(true);
      }
      // Scroll to top of sidebar to show filtered results
      setTimeout(() => {
        const sidebarContent = document.querySelector('.sidebar-scrollable');
        if (sidebarContent) {
          sidebarContent.scrollTop = 0;
        }
      }, 200);
    };

    window.addEventListener('vendor-select', handleVendorSelect as EventListener);
    window.addEventListener('city-select', handleCitySelectFromButton as EventListener);
    
    return () => {
      window.removeEventListener('vendor-select', handleVendorSelect as EventListener);
      window.removeEventListener('city-select', handleCitySelectFromButton as EventListener);
    };
  }, [filteredVendors, userLocation, onVendorSelect, mapReady]);

  // Get unique countries, cities, and categories
  const countries = useMemo(
    () => Array.from(new Set(sampleVendors.map((v) => v.country))).sort(),
    []
  );
  const cities = useMemo(
    () => {
      const vendorList = selectedCountry === "all" 
        ? sampleVendors 
        : sampleVendors.filter((v) => v.country === selectedCountry);
      return Array.from(new Set(vendorList.map((v) => v.city))).sort();
    },
    [selectedCountry]
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(sampleVendors.flatMap((v) => v.categories))
      ).sort(),
    []
  );

  // Handle country selection
  const handleCountryChange = (country: string) => {
    // Set flag to prevent useEffect from interfering
    isCountryChangingRef.current = true;
    countryChangeRef.current = country;
    
    setSelectedCountry(country);
    setSelectedCity("all"); // Reset city when country changes
    
    if (country !== "all" && countryCoordinates[country]) {
      const coords = countryCoordinates[country];
      
      // Update state
      setMapCenter([coords.lat, coords.lng]);
      setZoom(coords.zoom);
      
      // Force immediate map update - don't wait for useEffect
      if (mapRef.current) {
        // Use flyTo for smoother animation to distant locations
        mapRef.current.flyTo([coords.lat, coords.lng], coords.zoom, {
          duration: 2.0,
          easeLinearity: 0.25
        });
        
        // Reset flag after animation completes (2 seconds + buffer)
        setTimeout(() => {
          isCountryChangingRef.current = false;
        }, 2500);
      } else {
        // If map not ready, wait a bit and try again
        setTimeout(() => {
          if (mapRef.current && countryChangeRef.current === country) {
            mapRef.current.flyTo([coords.lat, coords.lng], coords.zoom, {
              duration: 2.0,
              easeLinearity: 0.25
            });
            setTimeout(() => {
              isCountryChangingRef.current = false;
            }, 2500);
          } else {
            isCountryChangingRef.current = false;
          }
        }, 200);
      }
    } else {
      // Default to India view
      const indiaCoords = [20.5937, 78.9629] as [number, number];
      setMapCenter(indiaCoords);
      setZoom(5);
      
      if (mapRef.current) {
        mapRef.current.flyTo(indiaCoords, 5, {
          duration: 2.0,
          easeLinearity: 0.25
        });
        setTimeout(() => {
          isCountryChangingRef.current = false;
        }, 2500);
      } else {
        setTimeout(() => {
          if (mapRef.current && countryChangeRef.current === country) {
            mapRef.current.flyTo(indiaCoords, 5, {
              duration: 2.0,
              easeLinearity: 0.25
            });
            setTimeout(() => {
              isCountryChangingRef.current = false;
            }, 2500);
          } else {
            isCountryChangingRef.current = false;
          }
        }, 200);
      }
    }
  };

  // Handle city selection
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (city !== "all" && cityCoordinates[city]) {
      setMapCenter([cityCoordinates[city].lat, cityCoordinates[city].lng]);
      setZoom(11);
    } else {
      // Reset to show selected country or all
      if (selectedCountry !== "all" && countryCoordinates[selectedCountry]) {
        const coords = countryCoordinates[selectedCountry];
        setMapCenter([coords.lat, coords.lng]);
        setZoom(coords.zoom);
      } else {
        setMapCenter([20.5937, 78.9629]);
        setZoom(5);
      }
    }
  };

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

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Compact Header */}
      <div className="bg-white border-b shadow-sm p-2 z-20 flex-shrink-0">
        <div className="container mx-auto sm:px-4 px-2">
          <div className="flex items-center justify-between sm:gap-2 gap-1">
            <h1 className="text-sm md:text-lg font-bold text-gray-900 flex-shrink-0 hidden sm:block">
              Find Vendors
            </h1>
            
            {/* Compact Search */}
            <div className="flex-1 sm:max-w-md min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 h-8 text-sm w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-1 items-center flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 px-2 text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 px-2"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-2 pt-2 border-t grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="City" />
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
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Category" />
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

              <Button
                variant="outline"
                size="sm"
                onClick={getUserLocation}
                className="h-8 text-xs"
              >
                <Navigation className="h-3 w-3 mr-1" />
                My Location
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Fixed height, no scroll */}
      <div className="flex-1 flex overflow-hidden relative" style={{ height: "calc(100vh - 120px)" }}>
        {/* Leaflet Map - Always visible on mobile */}
        <div 
          ref={mapContainerRef}
          className="flex-1 relative w-full z-0" 
          style={{ height: "100%", width: "100%", position: "relative" }}
        >
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sm-red mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Backdrop for mobile sidebar */}
        <AnimatePresence>
          {showSidebar && (isMobile || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[15] md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </AnimatePresence>

        {/* Floating Toggle Button - Center Arrow for Mobile */}
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[60] md:hidden">
          <Button
            onClick={() => {
              // Ensure mobile detection is correct
              if (window.innerWidth < 768) {
                setIsMobile(true);
              }
              setShowSidebar(!showSidebar);
            }}
            className="rounded-full h-14 w-14 shadow-xl bg-sm-red hover:bg-sm-red-light border-2 border-white flex items-center justify-center"
            size="icon"
          >
            <motion.div
              animate={{ rotate: showSidebar ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp className="h-6 w-6 text-white" />
            </motion.div>
          </Button>
        </div>

        {/* Vendor List Sidebar - Bottom Sheet on Mobile, Always Visible on Desktop */}
        {/* Desktop Sidebar - Always Visible, Fixed Width, Scrollable */}
        <div className="hidden md:flex md:w-80 bg-white border-l z-10 shadow-lg flex-col sidebar-container" style={{ height: "calc(100vh - 120px)", maxHeight: "calc(100vh - 120px)", overflow: "hidden" }}>
          {/* Sidebar Header - Fixed */}
          <div className="p-3 border-b bg-white z-10 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                Vendors ({filteredVendors.length})
              </h2>
              {userLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserLocation(null)}
                  className="h-8 w-8 p-0"
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

          {/* Sidebar Content - Scrollable, Hidden Scrollbar */}
          <div className="p-3 space-y-3 overflow-y-auto sidebar-scrollable" style={{ flex: "1 1 auto", minHeight: 0, maxHeight: "100%" }}>
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
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base truncate" title={vendor.businessName}>
                              {vendor.businessName.length > 20 
                                ? `${vendor.businessName.substring(0, 20)}...` 
                                : vendor.businessName}
                            </h3>
                            {vendor.isVerified && (
                              <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{vendor.city}, {vendor.state}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
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
                          className="flex-1 text-xs h-9"
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
                          className="flex-1 text-xs h-9"
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

        {/* Mobile Bottom Sheet - Conditional with Animation */}
        <AnimatePresence>
          {showSidebar && (isMobile || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
            <motion.div
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 w-full h-[70vh] bg-white border-t overflow-y-auto z-[20] shadow-2xl rounded-t-2xl md:hidden mobile-bottom-sheet"
              style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
            >
              {/* Drag Handle for Mobile */}
              <div className="flex justify-center pt-3 pb-2 md:hidden">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              
              <div className="p-3 md:p-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base md:text-lg font-semibold">
                    Vendors ({filteredVendors.length})
                  </h2>
                  <div className="flex gap-2">
                    {userLocation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserLocation(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSidebar(false)}
                      className="md:hidden h-8 w-8 p-0"
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

              <div className="p-3 md:p-4 space-y-3 md:space-y-4">
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
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1 md:gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate" title={vendor.businessName}>
                                  {vendor.businessName.length > 20 
                                    ? `${vendor.businessName.substring(0, 20)}...` 
                                    : vendor.businessName}
                                </h3>
                                {vendor.isVerified && (
                                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{vendor.city}, {vendor.state}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs md:text-sm font-medium">
                                {vendor.rating}
                              </span>
                              <span className="text-xs text-gray-500 hidden sm:inline">
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

                          <div className="flex gap-1 md:gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-xs h-8 md:h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${vendor.phone}`);
                              }}
                            >
                              <Phone className="h-3 w-3 md:mr-1" />
                              <span className="hidden sm:inline">Call</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-xs h-8 md:h-9"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`mailto:${vendor.email}`);
                              }}
                            >
                              <Mail className="h-3 w-3 md:mr-1" />
                              <span className="hidden sm:inline">Email</span>
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

      {/* Vendor Detail Modal - same as before */}
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
          height: 100% !important;
          width: 100% !important;
          z-index: 1;
          position: relative !important;
        }
        .leaflet-map-pane {
          height: 100% !important;
          width: 100% !important;
        }
        .custom-vendor-marker {
          background: transparent !important;
          border: none !important;
        }
        .city-marker {
          background: transparent !important;
          border: none !important;
        }
        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }
        .vendor-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        /* Hide scrollbar for sidebar */
        .sidebar-scrollable {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .sidebar-scrollable::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        /* Prevent body scroll when bottom sheet is open */
        body.bottom-sheet-open {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }
        /* Mobile bottom sheet overscroll behavior */
        .mobile-bottom-sheet {
          overscroll-behavior: contain !important;
          overscroll-behavior-y: contain !important;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
        }
        .mobile-bottom-sheet::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};


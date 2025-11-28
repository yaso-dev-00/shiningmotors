"use client";
import React, { useState } from 'react';
import Layout from "@/components/Layout";
import { GarageCard } from '@/components/sim-racing/GarageCard';
import { useQuery } from "@tanstack/react-query";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, MapPin, Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

const SimRacingGarages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  
  const { data: garages = [], isLoading } = useQuery({
    queryKey: ["allSimGarages"],
    queryFn: async () => {
      const { data, error } = await simAppApi.garages.getAllGarages();
      if (error) {
        console.error("Error fetching sim garages:", error);
        return [];
      }
      return data || [];
    },
  });

  // Extract unique locations and services for filters
  const locations = [...new Set(garages.map(garage => 
    garage.city ? `${garage.city}${garage.state ? `, ${garage.state}` : ''}` : null
  ).filter(Boolean))];
  
  const services = [...new Set(
    garages.flatMap(garage => garage.services_offered || []).filter(Boolean)
  )];

  // Filter garages based on search term and filters
  const filteredGarages = garages.filter(garage => {
    const matchesSearch = searchTerm === "" || 
      garage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (garage.services_offered && garage.services_offered.some(service => 
        service.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesLocation = locationFilter === "all" || 
      (garage.city && `${garage.city}${garage.state ? `, ${garage.state}` : ''}`.includes(locationFilter));
    
    const matchesService = serviceFilter === "all" || 
      (garage.services_offered && garage.services_offered.some(
        service => service.toLowerCase().includes(serviceFilter.toLowerCase())
      ));
    
    return matchesSearch && matchesLocation && matchesService;
  });
  const router = useRouter();
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Button
                variant="ghost"
                onClick={() => router.push('/sim-racing' as any)}
                className="mb-6 px-0"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to SIM Page
              </Button>
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sim Racing Garages</h1>
          <p className="text-gray-600">
            Find professional sim racing garages offering setup services, coaching, and more.
          </p>
        </header>

        {/* Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search for garages..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-auto">
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <SelectValue placeholder="Location" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location, index) => (
                    <SelectItem key={index} value={location as string}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select
                value={serviceFilter}
                onValueChange={setServiceFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <SlidersHorizontal size={16} className="mr-2 text-gray-500" />
                    <SelectValue placeholder="Service Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map((service, index) => (
                    <SelectItem key={index} value={service as string}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Garages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className="h-64 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredGarages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGarages.map((garage, index) => (
              <GarageCard key={garage.id} garage={garage} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No garages found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SimRacingGarages;
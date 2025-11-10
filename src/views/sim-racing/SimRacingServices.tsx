"use client";
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { simAppApi } from '@/integrations/supabase/modules/simAppPage';
import { GarageCard } from '@/components/sim-racing/GarageCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SimRacingServices = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all garages with their services
  const { data: garages = [], isLoading } = useQuery({
    queryKey: ['simGarages'],
    queryFn: async () => {
      const { data, error } = await simAppApi.garages.getAllGarages();
      if (error) {
        console.error("Error fetching sim garages:", error);
        return [];
      }
      return data || [];
    },
  });

  // Service categories
  const serviceTypes = [
    "Setup Development",
    "Coaching",
    "Hardware",
    "Custom Builds",
    "Maintenance",
    "Software"
  ];

  // Filter garages based on search and active tab
  const filteredGarages = garages.filter(garage => {
    const matchesSearch = searchQuery === '' || 
      garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (garage.services_offered && garage.services_offered.some(service => 
        service.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesCategory = activeTab === 'all' || 
      (garage.services_offered && garage.services_offered.includes(activeTab));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Sim Racing Services</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Professional services to enhance your sim racing experience
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {serviceTypes.map(type => (
              <Badge 
                key={type} 
                variant={activeTab === type ? "default" : "outline"}
                className="cursor-pointer py-2 px-4 text-sm"
                onClick={() => setActiveTab(type)}
              >
                {type}
              </Badge>
            ))}
            <Badge 
              variant={activeTab === 'all' ? "default" : "outline"}
              className="cursor-pointer py-2 px-4 text-sm"
              onClick={() => setActiveTab('all')}
            >
              All Services
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-2/3 rounded" />
                  <Skeleton className="h-4 w-full mt-2 rounded" />
                  <Skeleton className="h-4 w-3/4 mt-1 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredGarages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGarages.map((garage, index) => (
                <GarageCard key={garage.id} garage={garage} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No services matching your criteria. Please try different search terms.
            </div>
          )
        )}
      </div>
    </Layout>
  );
};

export default SimRacingServices;

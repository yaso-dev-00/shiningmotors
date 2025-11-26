
"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import EventsGrid from "@/components/events/EventsGrid";
import EventCategories from "@/components/events/EventCategories";
import { EventSlideshow } from "@/components/events/EventSlideshow";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Filter} from "lucide-react";
import { toast } from "sonner";
import HorizontalScroll from "@/components/homepage/HorizontalScroll";
import { ProductCardWrapper } from "@/components/shop/ProductCardWrapper";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { VehicleCardWrapper } from "@/components/vehicles/VehicleCardWrapper";
import { ServicePost } from "@/integrations/supabase/modules/services";
import ServicePostsCarousel, { parseServiceContent } from "@/components/services/ServicePostsCarousel";
import type { Product } from "@/integrations/supabase/modules/shop";
import type { ExtendedVehicle } from "@/integrations/supabase/modules/vehicles";

interface EventsProps {
  featuredEvents: any[];
  categories: string[];
  upcomingEvents: any[];
  pastEvents: any[];
  featuredProducts: Product[];
  featuredVehicles: ExtendedVehicle[];
  performanceServices: ServicePost[];
}

const Events = ({
  featuredEvents,
  categories,
  upcomingEvents,
  pastEvents,
  featuredProducts,
  featuredVehicles,
  performanceServices,
}: EventsProps) => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const isLoadingProducts = false;
  const isLoadingVehicles = false;
  const isLoading = false;
  
  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {/* Hero Section with Event Slideshow */}
        <section>
          {featuredEvents.length > 0 && (
            <EventSlideshow events={featuredEvents} />
          )}
        </section>
        
        {/* Main Content */}
        <section className="container max-[769px]:px-3 py-6 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-5 md:gap-8">
            {/* Main Content Area */}
            <div className="w-full max-w-5xl">
              <h2 className="text-3xl font-bold mb-6">Explore Events</h2>
              
              {/* Categories */}
              <EventCategories categories={categories} className="mb-8" />
              
              {/* Tabs */}
              <Tabs 
                defaultValue="upcoming" 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="mb-8"
              >
                <TabsList>
                  <TabsTrigger value="upcoming" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger value="past" className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Past
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="mt-6">
                    <EventsGrid events={upcomingEvents} />
                </TabsContent>
                
                <TabsContent value="past" className="mt-6">
                    <EventsGrid events={pastEvents} />
                </TabsContent>
              </Tabs>
              
            </div>
            
            {/* Sidebar */}
            <div className="w-full md:w-80 shrink-0 space-y-4 md:space-y-6">
              {/* Filters Card */}
             
              <div className="bg-gray-50 p-5 md:p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 md:mb-4 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Find Your Perfect Event
                </h3>
                <p className="text-gray-600 mb-3 md:mb-4">
                  Browse our upcoming events or filter by category to find what interests you.
                </p>
                <Button className="w-full bg-sm-red hover:bg-sm-700">
                  View All Events
                </Button>
              </div>
              
              {/* Featured Events Card */}
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 md:mb-4">Featured Categories</h3>
                <div className="space-y-1 md:space-y-2">
                  {categories.slice(0, 5).map((category) => (
                    <a
                      key={category}
                      href={`/events/category/${category}`}
                      className="block p-2 hover:bg-red-100 rounded-md transition-colors"
                    >
                      {category}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
               <section className="py-2 max-[769px]:pt-4">
          <div className="mx-auto ">
         <div className="flex py-1 md:py-0 justify-between items-center mb-1">
            <h2 className="text-[22px] md:text-3xl font-bold">Performance and Racing Parts</h2>
            <NextLink href={"/shop/category/performance-racing-parts"} className="text-sm-red flex items-center hover:underline">
              <span className="hidden sm:inline-block">Shop All</span> <ArrowRight size={16} className="ml-1" />
            </NextLink>
          </div>
            <HorizontalScroll padding="sm:px-0">
            {isLoadingProducts ?  Array(4)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 h-48 bg-gray-200 rounded-xl" />
              ))
               : featuredProducts && featuredProducts.length > 0 ? (
                featuredProducts.slice(0, 10).map((product: Product, index: number) => (
                  <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                >
                 <ProductCardWrapper product={product} />
                </motion.div>
                 
                ))
              ) : (
                <div className="pl-4 basis-full">
                  <div className="text-center py-10">No products found</div>
                </div>
              )}
            </HorizontalScroll>
            {/* <EnhancedCarousel>
              {isLoadingProducts ? (
                Array(4).fill(0).map((_, index) => (
                  <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
                  </CarouselItem>
                ))
              ) : featuredProducts && featuredProducts.length > 0 ? (
                featuredProducts.slice(0, 10).map((product) => (
                  <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 transition-all duration-300">
                    <div className="h-full">
                      <ProductCardWrapper product={product} />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem className="pl-4 basis-full">
                  <div className="text-center py-10">No products found</div>
                </CarouselItem>
              )}
            </EnhancedCarousel> */}
          </div>
        </section>
        <section className="py-6 bg-gray-50">
          <div className="mx-auto">
          <div className="flex py-1 md:py-0  justify-between items-center mb-1">
            <h2 className="text-[22px] md:text-3xl font-bold">Performance and Racing vehicles</h2>
            <NextLink href={"/vehicles/category/performance-racing"} className="text-sm-red flex items-center hover:underline">
             <span className="hidden sm:inline-block">view All</span>  <ArrowRight size={16} className="ml-1" />
            </NextLink>
          </div>
            <HorizontalScroll padding="sm:px-0">
            {isLoadingVehicles ? (
                 Array(4)
                 .fill(0)
                 .map((_, index) => (
                   <div key={index} className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 h-48 bg-gray-200 rounded-xl" />
                 ))
              ) : featuredVehicles && featuredVehicles.length > 0 ? (
                featuredVehicles.slice(0, 10).map((vehicle, index: number) => {
                  const extendedVehicle: ExtendedVehicle = {
                    ...vehicle,
                    fuel_type: vehicle.fuel_type || '',
                    status: vehicle.status || 'Available',
                  };
                  return (
                  <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                >
                 <VehicleCardWrapper vehicle={extendedVehicle} />
                </motion.div>
                  );
                })
              ) : (
                <div className="pl-4 basis-full">
                  <div className="text-center py-10">No vehicles found</div>
                </div>
              )}
            </HorizontalScroll>
            {/* <EnhancedCarousel>
              {isLoadingVehicles ? (
                Array(3).fill(0).map((_, index) => (
                  <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/4">
                    <div className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
                  </CarouselItem>
                ))
              ) : featuredVehicles && featuredVehicles.length > 0 ? (
                featuredVehicles.slice(0, 10).map((vehicle) => (
                  <CarouselItem key={vehicle.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/4 transition-all duration-300">
                    <div className="h-full">
                      <VehicleCardWrapper vehicle={vehicle} />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <CarouselItem className="pl-4 basis-full">
                  <div className="text-center py-10">No vehicles found</div>
                </CarouselItem>
              )}
            </EnhancedCarousel> */}
          </div>
        </section>

        <motion.div 
              className="space-y-0 "
              variants={ {
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { 
                    staggerChildren: 0.1,
                    delayChildren: 0.2
                  }
                }
              }}
              initial="hidden"
              animate="visible"
            >
               
              
              {/* Recently Added Services carousel */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ServicePostsCarousel
                  title="Customization & Performance"
                  posts={performanceServices?.slice(0, 10).map((post: ServicePost) => ({
                    ...parseServiceContent(post),
                    category: post.category || '',
                  })) || []}
                  isLoading={isLoading}
                  viewAllLink="/services/category/customization"
                />
              </motion.div>
              
            
              
            </motion.div>
               </div>
        </section>
      </div>
    </Layout>
  );
};

export default Events;

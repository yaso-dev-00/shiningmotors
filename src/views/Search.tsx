"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import { shopApi, vehiclesApi } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { ProductCardWrapper } from "@/components/shop/ProductCardWrapper";
import { VehicleCardWrapper } from "@/components/vehicles/VehicleCardWrapper";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import ServiceCard from "@/components/services/ServiceCard";
import { parseServiceContent } from "@/components/services/ServicePostsCarousel";
import Layout from "@/components/Layout";

const Search = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState("products");
  useEffect(()=>{
     window.scrollTo(0,0)
  },[])
  useEffect(() => {
    const initialTab = searchParams.get("tab");
    if (initialTab && ["products", "vehicles", "events", "services"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [searchParams]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (term) {
      params.set("q", term);
      params.set("tab", activeTab);
    } else {
      params.delete("q");
      params.delete("tab");
    }
    const query = params.toString();
    router.push((query ? `${pathname}?${query}` : pathname) as any);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("q");
    params.delete("tab");
    const query = params.toString();
    router.push((query ? `${pathname}?${query}` : pathname) as any);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm) {
      params.set("q", searchTerm);
    } else {
      params.delete("q");
    }
    params.set("tab", tab);
    const query = params.toString();
    router.push((query ? `${pathname}?${query}` : pathname) as any);
  };

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchTerm, activeTab],
    queryFn: async () => {
      if (!searchTerm) return [];

      switch (activeTab) {
        case "products":
          {
          const { data: products } = await shopApi.products.getFiltered({ 
            search: searchTerm,
            pageSize: 7
          });
          return products || [];
        }
        case "vehicles":
          {
          const { data: vehicles } = await vehiclesApi.vehicles.getFiltered({ 
            searchTerm: searchTerm
          }, 1, 7);
          return vehicles || [];
          }
        case "events":
          { const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
            .eq('status', 'published')
            .order('start_date', { ascending: true })
            .limit(7);
          if (eventsError) throw eventsError;
          return events || []; }
          
        case "services":
          {
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .limit(7);
          
          if (servicesError) throw servicesError;
          return services || [];
          }
        default:
          return [];
      }
    },
    enabled: !!searchTerm,
  });

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-sm-red" />
        </div>
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">No results found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter settings.
          </p>
        </div>
      );
    }

    if (activeTab === "products") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((result: any) => (
            <ProductCardWrapper key={result.id} product={result} />
          ))}
        </div>
      );
    }

    if (activeTab === "vehicles") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((result: any) => (
            <VehicleCardWrapper key={result.id} vehicle={result} />
          ))}
        </div>
      );
    }

    if (activeTab === "events") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((event: any) => (
           <EventCard
          key={event.id}
          id={event.id}
          title={event.title}
          category={event.category}
          start_date={event.start_date}
          end_date={event.end_date}
          venue={event.venue}
          city={event.city}
          banner_image_url={event.banner_image_url}
          tags={event.tags}
          registration_required={event.registration_required}
          max_participants={event.max_participants}
        />
          ))}
        </div>
      );
    }

    if (activeTab === "services") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((serviceData: any) => (
              <ServiceCard {...parseServiceContent(serviceData)} />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-12"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-auto w-auto p-1.5"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
         {!searchTerm && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <SearchIcon className="h-5 w-5" />
          </div>}
        </div>
      </div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        <div className="mt-6">{renderResults()}</div>
      </Tabs>
    </div>
    </Layout>
  );
};

export default Search;

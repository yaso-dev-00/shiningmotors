"use client";
import React, { useEffect, useState } from 'react';
import Layout from "@/components/Layout";
import { ProductCard } from '@/components/sim-racing/ProductCard';
import { useQuery } from "@tanstack/react-query";
import { simAppApi } from "@/integrations/supabase/modules/simAppPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Car, Gamepad ,ChevronLeft} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';

const categories = [
  { id: "all", name: "All Equipment", icon: <Gamepad className="h-5 w-5" /> },
  { id: "steering_wheels", name: "Steering Wheels", icon: <Car className="h-5 w-5" /> },
  { id: "pedals", name: "Pedals", icon: <Gamepad className="h-5 w-5" /> },
  { id: "cockpits", name: "Cockpits", icon: <Gamepad className="h-5 w-5" /> },
  { id: "monitors", name: "Monitors", icon: <Gamepad className="h-5 w-5" /> },
  { id: "accessories", name: "Accessories", icon: <Gamepad className="h-5 w-5" /> }
];

const SimRacingEquipment = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["simProducts"],
    queryFn: async () => {
      const { data, error } = await simAppApi.products.getFeaturedProducts(100);
      if (error) {
        console.error("Error fetching sim products:", error);
        return [];
      }
      return data || [];
    },
    enabled: typeof window !== 'undefined',
  });
  

  // Extract unique brands for filtering
  const brands = [...new Set(products.map(product => product.brand).filter(Boolean))];
console.log(products)
  // Filter products based on search, category, price and brand
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    
    let matchesPrice = true;
    if (priceFilter === "under100") {
      matchesPrice = product.price < 100;
    } else if (priceFilter === "100to500") {
      matchesPrice = product.price >= 100 && product.price <= 500;
    } else if (priceFilter === "500to1000") {
      matchesPrice = product.price > 500 && product.price <= 1000;
    } else if (priceFilter === "over1000") {
      matchesPrice = product.price > 1000;
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  });
console.log(filteredProducts)
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
          <h1 className="text-3xl font-bold mb-2">Sim Racing Equipment</h1>
          <p className="text-gray-600">
            Discover top-quality sim racing gear to enhance your racing experience
          </p>
        </header>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search for equipment..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-auto">
              <Select
                value={brandFilter}
                onValueChange={setBrandFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <SlidersHorizontal size={16} className="mr-2 text-gray-500" />
                    <SelectValue placeholder="Brand" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand, index) => (
                    <SelectItem key={index} value={brand as string}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select
                value={priceFilter}
                onValueChange={setPriceFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center">
                    <SlidersHorizontal size={16} className="mr-2 text-gray-500" />
                    <SelectValue placeholder="Price Range" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under100">Under $100</SelectItem>
                  <SelectItem value="100to500">$100 - $500</SelectItem>
                  <SelectItem value="500to1000">$500 - $1000</SelectItem>
                  <SelectItem value="over1000">Over $1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Categories Tabs */}
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="mb-4 flex flex-wrap h-auto">
            {categories.map((category) => (
              <TabsTrigger value={category.id} key={category.id} className="flex items-center gap-2">
                {category.icon}
                <span>{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {/* This content is shown for all categories */}
          </TabsContent>
        </Tabs>

        {/* Featured Products Section */}
        {activeCategory === "all" && !searchTerm && !priceFilter && !brandFilter && (
          <>
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Featured Bundles</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-2/5 h-60">
                      <img 
                        src="https://images.unsplash.com/photo-1631041556964-57f2686f1130" 
                        alt="Beginner Bundle" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full md:w-3/5 p-6">
                      <CardHeader className="px-0 pt-0">
                        <Badge className="mb-2 bg-blue-600 hover:bg-blue-700">Best Seller</Badge>
                        <CardTitle>Beginner Racing Bundle</CardTitle>
                        <CardDescription>Perfect starter kit for sim racing enthusiasts</CardDescription>
                      </CardHeader>
                      <CardContent className="px-0 py-2">
                        <div className="text-2xl font-bold">$499.99</div>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li className="flex items-center">• Entry-level wheel and pedal set</li>
                          <li className="flex items-center">• Basic wheel stand</li>
                          <li className="flex items-center">• 3-month coaching subscription</li>
                        </ul>
                      </CardContent>
                      <CardFooter className="px-0 pt-2">
                        <Button className="w-full">View Bundle</Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
                
                <Card className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-2/5 h-60">
                      <img 
                        src="https://images.unsplash.com/photo-1631041556964-57f2686f1130" 
                        alt="Pro Bundle" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full md:w-3/5 p-6">
                      <CardHeader className="px-0 pt-0">
                        <Badge className="mb-2 bg-orange-600 hover:bg-orange-700">Pro Choice</Badge>
                        <CardTitle>Professional Racing Bundle</CardTitle>
                        <CardDescription>Competition-grade equipment for serious racers</CardDescription>
                      </CardHeader>
                      <CardContent className="px-0 py-2">
                        <div className="text-2xl font-bold">$1,499.99</div>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li className="flex items-center">• Direct drive wheel base</li>
                          <li className="flex items-center">• Pro-grade pedals with load cell</li>
                          <li className="flex items-center">• Full cockpit with racing seat</li>
                        </ul>
                      </CardContent>
                      <CardFooter className="px-0 pt-2">
                        <Button className="w-full">View Bundle</Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            <Separator className="my-8" />
          </>
        )}

        {/* Products Grid */}
        <div className="mb-2">
          <h2 className="text-2xl font-semibold mb-4">
            {activeCategory === "all" ? "All Equipment" : 
             categories.find(cat => cat.id === activeCategory)?.name || "Products"}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div 
                key={i} 
                className="h-80 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SimRacingEquipment;
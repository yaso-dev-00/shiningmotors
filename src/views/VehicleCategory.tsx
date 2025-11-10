"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname, useSearchParams as useNextSearchParams } from "next/navigation";
import { vehiclesApi, type Vehicle, type ExtendedVehicle } from "@/integrations/supabase/modules/vehicles";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { VehicleCardWrapper } from "@/components/vehicles/VehicleCardWrapper";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowLeft, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";
import HorizontalScrollForVehicles from "@/components/homepage/HorizontalScroll";

type CategoryKey = "luxury" | "performance" | "vintage" | "exotic";

const categoryInfo: Record<CategoryKey, { name: string; description: string; image: string }> = {
  "luxury": {
    name: "Luxury Cars",
    description: "Exclusive high-end vehicles with premium comfort and advanced technology.",
    image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a"
  },
  "performance": {
    name: "Performance & Racing",
    description: "High-performance sports cars and track-ready racing machines.",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b"
  },
  "vintage": {
    name: "Vintage & Classic",
    description: "Rare and collectible classics from the golden eras of automotive history.",
    image: "https://images.unsplash.com/photo-1566024164372-0281f1133aa6"
  },
  "exotic": {
    name: "Exotic & Supercars",
    description: "Ultra-rare and exclusive supercars and hypercars from elite manufacturers.",
    image: "https://images.unsplash.com/photo-1614200179396-2bdb77ebo70d"
  }
};

const VehicleCategory = () => {
  const { category } = useParams<{ category: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  
  const setSearchParams = (params: URLSearchParams) => {
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname || "";
    router.push(url as any);
  };
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    make: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    status: ""
  });
  
  const { toast } = useToast();
  const itemsPerPage = 15;
    useEffect(()=>{
       window.scrollTo(0,0)
    },[])
  const [isInitial,setIsInitial]=useState(true)
 useEffect(()=>{
     if(!isInitial)
     {

     
     setTimeout(() => {
       const element = document.getElementById('vehicle');
       if (element) {
         element.scrollIntoView({ behavior: 'smooth' });
        
       }
     
     }, 100);
   }
   
   setIsInitial(false)
 },[currentPage])
  // Initialize state from URL params
  useEffect(() => {
    const page = parseInt(searchParams?.get("page") || "1");
    const search = searchParams?.get("search") || "";
    const make = searchParams?.get("make") || "";
    const minPrice = searchParams?.get("minPrice") || "";
    const maxPrice = searchParams?.get("maxPrice") || "";
    const minYear = searchParams?.get("minYear") || "";
    const maxYear = searchParams?.get("maxYear") || "";
    const status = searchParams?.get("status") || "";
    
    setCurrentPage(page);
    setSearchTerm(search);
    setFilters({
      make,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      status
    });
  }, [searchParams]);
  
  // Update URL when params change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (filters.make) params.set("make", filters.make);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minYear) params.set("minYear", filters.minYear);
    if (filters.maxYear) params.set("maxYear", filters.maxYear);
    if (filters.status) params.set("status", filters.status);
    
    setSearchParams(params);
  }, [currentPage, debouncedSearchTerm, filters, router]);
  
  // Fetch vehicles when params change
  useEffect(() => {
    if (category) {
      fetchVehicles();
    }
  }, [category, currentPage, debouncedSearchTerm, filters]);
  
  const fetchVehicles = async () => {
    if (!category) return;
    
    setLoading(true);
    try {
      let query = vehiclesApi.vehicles.select().eq("category", category);
      
      // Apply filters
      if (filters.make) {
        query = query.eq("make", filters.make);
      }
      
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      
      if (filters.minPrice) {
        query = query.gte("price", parseInt(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        query = query.lte("price", parseInt(filters.maxPrice));
      }
      
      if (filters.minYear) {
        query = query.gte("year", parseInt(filters.minYear));
      }
      
      if (filters.maxYear) {
        query = query.lte("year", parseInt(filters.maxYear));
      }
      
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,make.ilike.%${debouncedSearchTerm}%,model.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Get total count for pagination
      const { count } = await query;
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      setVehicles(((data || []) as Vehicle[]).map((v: Vehicle): ExtendedVehicle => ({
        ...v,
        fuel_type: v.fuel_type || 'Gasoline',
        status: (v.status || 'Available') as string,
      })));
    } catch (error: unknown) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters({
      make: "",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      status: ""
    });
    setSearchTerm("");
    setCurrentPage(1);
  };
  
  const categoryData = category && category in categoryInfo 
    ? categoryInfo[category as CategoryKey] 
    : category 
      ? { name: category, description: "", image: "" } 
      : null;
  
  if (!categoryData) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <h2 className="mb-4 text-2xl font-bold">Category Not Found</h2>
            <Button onClick={() => router.push("/vehicles" as any)}>Back to Vehicles</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Category banner */}
        <div className="relative h-72 bg-gray-800 md:h-96">
          <img
            src={categoryData.image}
            alt={categoryData.name}
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 flex items-center bg-gradient-to-r from-sm-black/80 to-black/50">
            <div className="container mx-auto px-4">
              <Button 
                variant="outline"
                className="mb-4 flex items-center border-white text-black hover:bg-white hover:text-sm-black"
                onClick={() => router.push("/vehicles" as any)}
              >
                <ArrowLeft size={18} className="mr-1" /> All Vehicles
              </Button>
              <div className="max-w-lg">
                <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                  {categoryData.name}
                </h1>
                <p className="mb-6 text-gray-200">
                  {categoryData.description}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and filter section */}
        <section className="bg-gray-50 py-7">
          <div className="container mx-auto px-4">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-bold">Find Your Perfect {categoryData.name.replace(/ &.+$/, '')}</h3>
              
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by make, model, or keywords..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} className="mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
                
                <Button className="bg-sm-red hover:bg-sm-red-light" onClick={fetchVehicles}>
                  <Search size={16} className="mr-2" /> Search Vehicles
                </Button>
              </div>
              
              {showFilters && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold">Filters</h4>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">
                      Clear All
                    </Button>
                  </div>
                  
                  {/* Active filters */}
                  {(filters.make || filters.minPrice || filters.maxPrice || filters.minYear || filters.maxYear || filters.status) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {filters.make && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Make: {filters.make}
                          <X 
                            size={14} 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleFilterChange("make", "")} 
                          />
                        </Badge>
                      )}
                      {filters.minPrice && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Min Price: ${filters.minPrice}
                          <X 
                            size={14} 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleFilterChange("minPrice", "")} 
                          />
                        </Badge>
                      )}
                      {filters.maxPrice && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Max Price: ${filters.maxPrice}
                          <X 
                            size={14} 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleFilterChange("maxPrice", "")} 
                          />
                        </Badge>
                      )}
                      {filters.minYear && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Min Year: {filters.minYear}
                          <X 
                            size={14} 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleFilterChange("minYear", "")} 
                          />
                        </Badge>
                      )}
                      {filters.maxYear && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Max Year: {filters.maxYear}
                          <X 
                            size={14} 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleFilterChange("maxYear", "")} 
                          />
                        </Badge>
                      )}
                      {filters.status && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Status: {filters.status}
                          <X 
                            size={14} 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleFilterChange("status", "")} 
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Make</label>
                      <Select value={filters.make} onValueChange={(value) => handleFilterChange("make", value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Makes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Makes</SelectItem>
                          <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                          <SelectItem value="BMW">BMW</SelectItem>
                          <SelectItem value="Audi">Audi</SelectItem>
                          <SelectItem value="Porsche">Porsche</SelectItem>
                          <SelectItem value="Ferrari">Ferrari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium">Price Range (Max)</label>
                      <Select value={filters.maxPrice} onValueChange={(value) => handleFilterChange("maxPrice", value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Price" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Price</SelectItem>
                          <SelectItem value="50000">Under $50,000</SelectItem>
                          <SelectItem value="100000">Under $100,000</SelectItem>
                          <SelectItem value="200000">Under $200,000</SelectItem>
                          <SelectItem value="500000">Under $500,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium">Year (Min)</label>
                      <Select value={filters.minYear} onValueChange={(value) => handleFilterChange("minYear", value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Year</SelectItem>
                          <SelectItem value="2023">2023 & Newer</SelectItem>
                          <SelectItem value="2020">2020 & Newer</SelectItem>
                          <SelectItem value="2015">2015 & Newer</SelectItem>
                          <SelectItem value="2010">2010 & Newer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium">Status</label>
                      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Status</SelectItem>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Reserved">Reserved</SelectItem>
                          <SelectItem value="Sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Vehicles listing */}
        <section className="py-9" id="vehicle">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {categoryData.name}
                {debouncedSearchTerm && ` - Search: "${debouncedSearchTerm}"`}
              </h2>
              
              <div className="flex items-center space-x-3">
                <Select defaultValue="newest">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By: Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Sort By: Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="year-desc">Year: Newest First</SelectItem>
                    <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="block sm:hidden">
              <HorizontalScrollForVehicles>
                {loading ? (
                  Array(4)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 h-48 rounded-xl bg-gray-200 animate-pulse flex flex-col justify-between"
                      >
                      </div>
                    ))
                ) :
                     vehicles.map((vehicle: ExtendedVehicle) => (
                    <motion.div
                      key={vehicle.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                    >
                         <VehicleCardWrapper key={vehicle.id} vehicle={vehicle} />
                    </motion.div>
                  ))
                }
              </HorizontalScrollForVehicles>
              <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
            {loading ? (
              <div className="hidden sm:grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse overflow-hidden">
                    <div className="h-64 bg-gray-300" />
                    <CardContent className="p-4">
                      <div className="mb-2 h-6 w-3/4 rounded bg-gray-300" />
                      <div className="mb-4 h-4 w-1/2 rounded bg-gray-300" />
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        <div className="h-4 rounded bg-gray-300" />
                        <div className="h-4 rounded bg-gray-300" />
                        <div className="h-4 rounded bg-gray-300" />
                        <div className="h-4 rounded bg-gray-300" />
                      </div>
                      <div className="h-10 rounded bg-gray-300" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <div className="hidden sm:grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {vehicles.map((vehicle: ExtendedVehicle) => (
                    <VehicleCardWrapper key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
{/*                 
                <PaginationBar 
                  currentPage={currentPage} 
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                /> */}
              </>
            ) : (
              <div className="py-12 text-center">
                <h3 className="mb-2 text-xl font-semibold">No vehicles found</h3>
                <p className="mb-6 text-gray-600">Try adjusting your filters or search terms</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default VehicleCategory;

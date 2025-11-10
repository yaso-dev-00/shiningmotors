import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { VehicleCardWrapper } from "@/components/vehicles/VehicleCardWrapper";
import VehicleCategories from "@/components/vehicles/VehicleCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehiclesApi, type ExtendedVehicle } from "@/integrations/supabase/modules/vehicles";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDebounce } from "@/hooks/useDebounce";
import HorizontalScrollForVehicles from "@/components/homepage/HorizontalScroll";
import { motion } from "framer-motion";
import HorizontalScrollCategories from "@/components/shop/HorizontalScroll";
import Image from "next/image";
interface VehicleFilters {
  category?: string;
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  status?: string;
  sortOption?: string;
}

const categoryImages = [
  "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b",
  "https://images.pexels.com/photos/210143/pexels-photo-210143.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/8911015/pexels-photo-8911015.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/163210/motorcycles-race-helmets-pilots-163210.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/315952/pexels-photo-315952.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/16524381/pexels-photo-16524381/free-photo-of-red-classic-car.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/19475233/pexels-photo-19475233/free-photo-of-a-child-running-on-the-beach-in-front-of-a-parked-camper-van.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const categories = [
  { value: "new-luxury-supercars", label: "New Luxury and Supercars" },
  { value: "used-luxury-cars", label: "Used Luxury Cars" },
  { value: "performance-racing", label: "Performance & racing" },
  { value: "exotic-supercars", label: "Exotic & Supercars" },
  { value: "superbikes", label: "Superbikes" },
  { value: "vintage-classic", label: "Vintage & Classic" },
  { value: "rare-collectible", label: "Rare & Collectible" },
  { value: "campervans-rvs", label: "Campervans & RVs" },
];

const Vehicles = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<ExtendedVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [sortOption, setSortOption] = useState("newest");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const { toast } = useToast();
  const itemsPerPage = 15;
  const positionRef = useRef<HTMLElement>();
  const [isInitial, setIsInitial] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, []);
  useEffect(() => {
    if (!isInitial) {
      setTimeout(() => {
        const element = document.getElementById("vehicle");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
    setIsInitial(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);
  // Initialize filters from URL params
  useEffect(() => {
    if (!searchParams) return;
    const category = searchParams.get("category") || undefined;
    const make = searchParams.get("make") || undefined;
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minYearParam = searchParams.get("minYear");
    const maxYearParam = searchParams.get("maxYear");
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";

    const initialFilters = {
      category,
      make,
      minPrice: minPriceParam ? parseInt(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseInt(maxPriceParam) : undefined,
      minYear: minYearParam ? parseInt(minYearParam) : undefined,
      maxYear: maxYearParam ? parseInt(maxYearParam) : undefined,
      status,
    };

    setFilters(initialFilters);
    setCurrentPage(page);
    setSearchTerm(search);
  }, [searchParams]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.category) params.set("category", filters.category);
    if (filters.make) params.set("make", filters.make);
    if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.minYear) params.set("minYear", filters.minYear.toString());
    if (filters.maxYear) params.set("maxYear", filters.maxYear.toString());
    if (filters.status) params.set("status", filters.status);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);

    router.push(`${pathname || ''}?${params.toString()}` as any);
  }, [filters, currentPage, debouncedSearchTerm, router, pathname]);

  // Fetch vehicles when filters, page, or search term changes
  useEffect(() => {
    fetchVehicles();
  }, [filters, currentPage, debouncedSearchTerm, sortOption]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let query = vehiclesApi.vehicles.select();

      // Apply filters
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.make) {
        query = query.eq("make", filters.make);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.minPrice) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.minYear) {
        query = query.gte("year", filters.minYear);
      }

      if (filters.maxYear) {
        query = query.lte("year", filters.maxYear);
      }

      if (debouncedSearchTerm) {
        const isNumber = !isNaN(Number(debouncedSearchTerm));
        if (isNumber) {
          const value = parseInt(debouncedSearchTerm);
          query = query.gte("year", value);
        } else {
          query = query.or(
            `title.ilike.%${debouncedSearchTerm}%,make.ilike.%${debouncedSearchTerm}%,model.ilike.%${debouncedSearchTerm}%`
          );
        }
      }

      // Get total count for pagination
      const { count } = await query;
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      switch (sortOption) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "year-desc":
          query = query.order("year", { ascending: false });
          break;
        case "mileage-asc":
          query = query.order("mileage", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
      const { data, error } = await query.range(from, to);

      if (error) throw error;

      // Transform Vehicle[] to ExtendedVehicle[]
      const extendedVehicles: ExtendedVehicle[] = (data || []).map((vehicle) => ({
        ...vehicle,
        fuel_type: vehicle.fuel_type ?? '',
        status: vehicle.status ?? 'available',
      }));
      
      setVehicles(extendedVehicles);
    } catch (error) {
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

  const handleFilterChange = (key: keyof VehicleFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCategorySelect = (category: string) => {
    router.push(("/vehicles/category/" + category) as any);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  const resetFilter = (key: keyof VehicleFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };
  // console.log(sortOption)
  const handleSortChange = (value: string) => {
    setSortOption(value);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero banner */}
        <div className="relative h-72 bg-gray-800 md:h-96">
          <Image
            src="https://images.unsplash.com/photo-1550355291-bbee04a92027"
            alt="Luxury vehicle"
            fill
            className="object-cover opacity-70"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 flex items-center bg-gradient-to-r from-sm-black/80 to-black/50">
            <div className="container mx-auto px-4">
              <div className="max-w-lg">
                <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                  Luxury & Performance Vehicles
                </h1>
                <p className="mb-6 text-gray-200">
                  Explore our curated collection of luxury, performance, and
                  collectible vehicles.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    className="bg-sm-red hover:bg-sm-red-light"
                    onClick={() => window.scrollTo(0, 500)}
                  >
                    Browse Inventory
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-black hover:bg-white hover:text-sm-black"
                    onClick={() => router.push("/admin/vehicles/create" as any)}
                  >
                    Sell Your Vehicle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories section */}
        <section className="py-5">
          <div className="container mx-auto px-4">
            <h2 className="mb-4 text-2xl font-bold">Browse by Category</h2>
            {/* <VehicleCategories onCategorySelect={handleCategorySelect} /> */}
            <HorizontalScrollCategories
              route="vehicles"
              categories={categories}
              randomImages={categoryImages}
            ></HorizontalScrollCategories>
          </div>
        </section>

        {/* Search and filter section */}
        <section className="bg-gray-50  py-0 md:py-5">
          <div className="container mx-auto px-4">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-xl font-bold">
                Find Your Perfect Vehicle
              </h3>

              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by make, model,year......"
                    className="pl-10 focus-visible:border-none"
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

                <Button
                  className="bg-sm-red hover:bg-sm-red-light"
                  onClick={fetchVehicles}
                >
                  <Search size={16} className="mr-2" /> Search Vehicles
                </Button>
              </div>

              {showFilters && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold">Filters</h4>
                    {Object.keys(filters).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-sm"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Active filters */}
                  {Object.keys(filters).length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {Object.entries(filters).map(
                        ([key, value]) =>
                          value && (
                            <Badge
                              key={key}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {key === "minPrice"
                                ? "Min Price: $" + value
                                : key === "maxPrice"
                                ? "Max Price: $" + value
                                : key === "minYear"
                                ? "Min Year: " + value
                                : key === "maxYear"
                                ? "Max Year: " + value
                                : `${key}: ${value}`}
                              <X
                                size={14}
                                className="ml-1 cursor-pointer"
                                onClick={() =>
                                  resetFilter(key as keyof VehicleFilters)
                                }
                              />
                            </Badge>
                          )
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Make
                      </label>
                      <Select
                        value={filters.make || ""}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "make",
                            value == "all" ? undefined : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Makes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Makes</SelectItem>
                          <SelectItem value="Mercedes-Benz">
                            Mercedes-Benz
                          </SelectItem>
                          <SelectItem value="BMW">BMW</SelectItem>
                          <SelectItem value="Audi">Audi</SelectItem>
                          <SelectItem value="Porsche">Porsche</SelectItem>
                          <SelectItem value="Ferrari">Ferrari</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Price Range
                      </label>
                      <Select
                        value={filters.maxPrice?.toString() || ""}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "maxPrice",
                            value ? parseInt(value) : undefined
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any Price" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any Price</SelectItem>
                          <SelectItem value="50000">Under $50,000</SelectItem>
                          <SelectItem value="100000">Under $100,000</SelectItem>
                          <SelectItem value="200000">Under $200,000</SelectItem>
                          <SelectItem value="500000">Under $500,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Year
                      </label>
                      <Select
                        value={filters.minYear?.toString() || ""}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "minYear",
                            value ? parseInt(value) : undefined
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1900">Any Year</SelectItem>
                          <SelectItem value="2023">2023 & Newer</SelectItem>
                          <SelectItem value="2020">2020 & Newer</SelectItem>
                          <SelectItem value="2015">2015 & Newer</SelectItem>
                          <SelectItem value="2010">2010 & Newer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Status
                      </label>
                      <Select
                        value={filters.status || ""}
                        onValueChange={(value) =>
                          handleFilterChange("status", value || undefined)
                        }
                      >
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

        {/* Vehicles section */}
        <section className="py-10 md:py-12" id="vehicle">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">
                {filters.category
                  ? `${filters.category} Vehicles`
                  : filters.make
                  ? `${filters.make} Vehicles`
                  : "All Vehicles"}
                {debouncedSearchTerm && ` - Search: "${debouncedSearchTerm}"`}
              </h2>

              <div className="flex items-center space-x-3">
                <Select defaultValue="newest" onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By: Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Sort By: Newest</SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="year-desc">
                      Year: Newest First
                    </SelectItem>
                    <SelectItem value="mileage-asc">
                      Mileage: Low to High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="hidden max-[640px]:block">
              <HorizontalScrollForVehicles>
                {loading
                  ? Array(4)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 h-72 rounded-xl  bg-gray-200 animate-pulse flex flex-col justify-between"
                        />
                      ))
                  : vehicles.map((vehicle) => (
                      <motion.div
                        key={vehicle.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                      >
                        <VehicleCardWrapper
                          key={vehicle.id}
                          vehicle={vehicle}
                        />
                      </motion.div>
                    ))}
              </HorizontalScrollForVehicles>
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
                  {vehicles.map((vehicle) => (
                    <VehicleCardWrapper key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="py-12 text-center">
                <h3 className="mb-2 text-xl font-semibold">
                  No vehicles found
                </h3>
                <p className="mb-6 text-gray-600">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-sm-black py-12 md:py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Are you a dealer?</h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-gray-300">
              List your inventory on Shining Motors and reach thousands of
              potential buyers every day.
            </p>
            <Button className="bg-sm-red hover:bg-sm-red-light">
              Join as a Dealer
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Vehicles;

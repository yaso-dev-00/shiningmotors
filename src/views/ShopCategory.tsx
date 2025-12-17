"use client";
import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/shop/ProductCard";
import { shopApi, type Product } from "@/integrations/supabase/modules/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Filter,
  Grid,
  List,
  SortDesc,
  Search,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductFilters } from "@/components/shop/ProductFilters";
import { PaginationBar } from "@/components/ui/PaginationBar";
import Layout from "@/components/Layout";
import { useDebounce } from "@/hooks/useDebounce";
import { categoryData } from "@/data/products";
import CategoryScroll from "@/components/shop/CategoryScroll";
import HorizontalScrollForShops from "@/components/homepage/HorizontalScroll";
import { motion } from "framer-motion";
import FilterSidebar from "@/components/shop/DynamicFilter";
import supabase from "@/integrations/supabase/client";
const PAGE_SIZE = 15;

const ShopCategory = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [parts, setParts] = useState("");
  const [selectedSubcategory, setSelected] = useState<string | null>(null);
  const [filterParts, setFilterParts] = useState<string[]>([])
  const [availableFilters, setAvailableFilters] = useState<Record<string, string[]>>({})
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast();

  const handleParts = (text: string) => {
    setParts(text);
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [isInitial, setIsInitial] = useState(true);

  useEffect(() => {
    if (!isInitial) {
      setTimeout(() => {
        const element = document.getElementById("products");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
    setIsInitial(false);
  }, [currentPage]);
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line

  }, [category, sortOption, selectedStatus, minPrice, maxPrice, currentPage, debouncedSearchTerm, parts, selectedSubcategory, selectedFilters]);


  const fetchProducts = async (overrideFilters?: {
    status?: string;
    sortOption?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: number;
    search?: string;
    parts?: string;
    selectedSubcategory?: string | null;
    selectedFilters?: Record<string, string[]>;
  }) => {
    setLoading(true);
    try {
      // Use override filters if provided, otherwise use state
      const filters = overrideFilters || {
        status: selectedStatus,
        sortOption: sortOption,
        minPrice: minPrice,
        maxPrice: maxPrice,
        page: currentPage,
        search: debouncedSearchTerm,
        parts: parts,
        selectedSubcategory: selectedSubcategory,
        selectedFilters: selectedFilters
      };
      
      if (category) {
        let filteredProducts = [];
        
        if (Object.keys(filters.selectedFilters || {}).length > 0) {
          // Use Filters table for efficient filtering
          const { data: filterData, error: filterError } = await supabase
            .from("Filters")
            .select("product_ids")
            .eq("category", category)
            .single();

          if (filterError) {
            console.error("Error loading filter data:", filterError);
            // Fallback to regular API
            const { data, count, error } = await shopApi.products.getFiltered({
              category,
              status: filters.status === "all" ? undefined : filters.status as "on_sale" | "upcoming" | "in_stock",
              sortBy: (filters.sortOption || "newest") as "price_asc" | "price_desc" | "newest" | "updated",
              page: filters.page || 1,
              pageSize: PAGE_SIZE,
              minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
              maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
              search: filters.search || "",
              parts: filters.parts || "",
              subCategory: filters.selectedSubcategory || undefined,
            });
            
            if (error) throw error;
            setProducts(data || []);
            setTotalCount(count || 0);
            return;
          }

          // Get product IDs that match ALL selected filter criteria
          const productIds = (filterData?.product_ids as Record<string, Record<string, string[]>>) || {};
          let matchingProductIds: string[] = [];

          if (Object.keys(productIds).length > 0) {
            // For each selected filter category, get product IDs
            const filterProductIds: string[][] = [];
            
            Object.entries(filters.selectedFilters || {}).forEach(([filterCategory, selectedValues]: [string, string[]]) => {
              const categoryProductIds: string[] = [];
              selectedValues.forEach((option: string) => {
                if (productIds[filterCategory]?.[option]) {
                  categoryProductIds.push(...productIds[filterCategory][option]);
                }
              });
              if (categoryProductIds.length > 0) {
                filterProductIds.push(categoryProductIds);
              }
            });

            if (filterProductIds.length > 0) {
              // Find intersection of all filter categories
              matchingProductIds = filterProductIds.reduce((acc: string[], curr: string[]) => 
                acc.filter((id: string) => curr.includes(id))
              );
            }
          }

          if (matchingProductIds.length > 0) {
            // Get products by IDs with additional filters
            const { data: filteredProducts, error: productError } = await supabase
              .from('products')
              .select('*')
              .in('id', matchingProductIds)
              .eq('category', category);

            if (productError) throw productError;

            // Apply additional filters (status, price, search, etc.)
            let finalProducts = filteredProducts || [];
            
            if (filters.status !== "all") {
              finalProducts = finalProducts.filter((p: Product) => p.status === filters.status);
            }
            
            if (filters.minPrice) {
              finalProducts = finalProducts.filter((p: Product) => p.price >= Number(filters.minPrice));
            }
            
            if (filters.maxPrice) {
              finalProducts = finalProducts.filter((p: Product) => p.price <= Number(filters.maxPrice));
            }
            
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              finalProducts = finalProducts.filter((p: Product) => 
                p.name.toLowerCase().includes(searchLower) ||
                p.category.toLowerCase().includes(searchLower) ||
                (p.subCategory && p.subCategory.toLowerCase().includes(searchLower)) ||
                (p.parts && p.parts.toLowerCase().includes(searchLower))
              );
            }
            
            if (filters.parts) {
              finalProducts = finalProducts.filter((p: Product) => p.parts === filters.parts);
            }
            
            if (filters.selectedSubcategory) {
              finalProducts = finalProducts.filter((p: Product) => p.subCategory === filters.selectedSubcategory);
            }

            // Apply sorting
            if (filters.sortOption === 'price_asc') {
              finalProducts.sort((a: Product, b: Product) => a.price - b.price);
            } else if (filters.sortOption === 'price_desc') {
              finalProducts.sort((a: Product, b: Product) => b.price - a.price);
            } else if (filters.sortOption === 'newest') {
              finalProducts.sort((a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }

            // Apply pagination
            const start = ((filters.page || 1) - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            const paginatedProducts = finalProducts.slice(start, end);

            setProducts(paginatedProducts);
            setTotalCount(finalProducts.length);
          } else {
            setProducts([]);
            setTotalCount(0);
          }
        } else {
          // No filters selected, use regular API
          const { data, count, error } = await shopApi.products.getFiltered({
            category,
            status: filters.status === "all" ? undefined : filters.status as "on_sale" | "upcoming" | "in_stock",
            sortBy: (filters.sortOption || "newest") as "price_asc" | "price_desc" | "newest" | "updated",
            page: filters.page || 1,
            pageSize: PAGE_SIZE,
            minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
            search: filters.search || "",
            parts: filters.parts || "",
            subCategory: filters.selectedSubcategory || undefined,
          });
          
          if (error) throw error;
          setProducts(data || []);
          setTotalCount(count || 0);
        }
      }
    } catch (error: unknown) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCategoryName = (name?: string) => {
    if (!name) return "Products";
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const resetAllFilters = () => {
    // Reset all state
    setSelectedStatus('all');
    setSortOption('newest');
    setMinPrice('');
    setMaxPrice('');
    setSelectedFilters({});
    setCurrentPage(1);
    setSearchTerm(''); // Also reset search term
    setParts(''); // Reset parts filter
    setSelected(null); // Reset subcategory
    
    // Force immediate fetch with reset values (bypass state, use direct values)
    fetchProducts({
      status: 'all',
      sortOption: 'newest',
      minPrice: '',
      maxPrice: '',
      page: 1,
      search: '',
      parts: '',
      selectedSubcategory: null,
      selectedFilters: {}
    });
  };

  const handleSubCategory = (text: string) => {
    setSelected(text);
    setParts("");
  };
  const data = category ? Object.keys((categoryData[category as keyof typeof categoryData]?.subCategories || {}) as Record<string, string[]>) : [];
  useEffect(() => {
    if (selectedSubcategory && category) {
      const data2 = categoryData[category as keyof typeof categoryData];
      setFilterParts((data2?.subCategories as Record<string, string[]>)?.[selectedSubcategory] || []);
    }
  }, [selectedSubcategory, category]);

  // Load available filter options from Filters table
  useEffect(() => {
    const loadFilters = async () => {
      if (category) {
        try {
          const { data: filterData, error } = await supabase
            .from("Filters")
            .select("filters")
            .eq("category", category)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error("Error loading filters:", error);
            return;
          }

          if (filterData?.filters) {
            setAvailableFilters(filterData.filters as Record<string, string[]>);
          } else {
            // Fallback to categoryData if no filters in database
            const categoryFilters = categoryData[category as keyof typeof categoryData]?.filters || []
            const filterMap: Record<string, string[]> = {}
            categoryFilters.forEach((filter: { name: string; options: string[] }) => {
              filterMap[filter.name] = filter.options
            })
            setAvailableFilters(filterMap)
          }
        } catch (error: unknown) {
          console.error("Error loading filters:", error);
        }
      }
    };

    loadFilters();
  }, [category])

  const handleCheckboxChange = (category: string, option: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];

      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[category];
      } else {
        newFilters[category] = updated;
      }

      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  

  return (
    <Layout>
      <div className="pt-4 grid grid-cols-1 gap-[10px]">
        <CategoryScroll
          handleClick={handleSubCategory}
          categories={data}
          selected={selectedSubcategory ?? undefined}
        ></CategoryScroll>
        {selectedSubcategory && (
          <div className="px-6">
            <h2 className="font-bold underline underline-offset-2 text-sm-red">
              Filter By Parts
            </h2>
          </div>
        )}
        {filterParts && (
          <CategoryScroll
            categories={filterParts}
            activeColor="bg-sm-red text-white border-sm-red"
            handleClick={handleParts}
            selected={parts}
          ></CategoryScroll>
        )}
      </div>

      <main
        className={`container mx-auto px-4 ${
          filterParts.length > 0 ? "pt-3" : "pt-0"
        } md:py-8 pb-24`}
      >
        <div className="mb-6 flex items-center">
          <NextLink
            href="/shop"
            className="mr-2 flex items-center text-sm-red hover:underline"
          >
            <ArrowLeft size={20} className="mr-1" />
          </NextLink>
          <h1 className="text-2xl font-bold md:text-3xl">
            {formatCategoryName(category)}
          </h1>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-[300px_1fr]">
          <div className="rounded-lg bg-white p-4 shadow md:block">
            <div className="flex justify-between w-full">
            <h2 className="mb-4 border-b pb-2 text-lg font-semibold">Filters</h2>
                {Object.keys(availableFilters).length > 0 && (
                  <p
                    onClick={() => setIsOpen(true)}
                    className="text-sm-red font-[600] cursor-pointer"
                  >
                    More Filters
                  </p>
                )}
             </div>
             {Object.keys(availableFilters).length > 0 && (
               <FilterSidebar
                 isOpen={isOpen}
                 setIsOpen={setIsOpen}
                 handleCheckboxChange={handleCheckboxChange}
                 selectedFilters={selectedFilters}
                 filters={availableFilters}
                 onApply={handleApplyFilters}
               />
             )}
            <ProductFilters
              status={selectedStatus}
              onStatusChange={setSelectedStatus}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onApply={handleFilterApply}
              resetFilters={resetAllFilters}
            />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name, category"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2" id="products">
                {/* <Button variant="outline" size="sm" className="flex items-center lg:hidden">
                  <Filter size={16} className="mr-2" /> Filter
                </Button> */}
                <Select value={sortOption} onValueChange={(value) => {
                  setSortOption(value);
                  setCurrentPage(1); // Reset to first page when sorting changes
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SortDesc size={16} className="mr-2" />
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price_desc">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden border-l border-gray-300 pl-3 sm:block">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setViewMode("list")}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
            {/* <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-8">
              <TabsList>
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="on_sale">On Sale</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="in_stock">In Stock</TabsTrigger>
              </TabsList>
            </Tabs> */}

            {loading ? (
              <div className="hidden sm:flex items-center justify-center py-20">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-sm-red" />
                <span>Loading products...</span>
              </div>
            ) : products.length > 0 ? (
              <>
                <div
                  className={`hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                    viewMode === "grid"
                      ? "lg:grid-cols-3 xl:grid-cols-4"
                      : "lg:grid-cols-1"
                  }`}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={undefined}
                      image={
                        (product.images && product.images[0]) ||
                        "/placeholder.svg"
                      }
                      category={product.category}
                      isNew={product.status === "new_arrival"}
                      isSale={product.status === "on_sale"}
                    />
                  ))}
                </div>
                <div className="hidden sm:block w-full">
                  <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 text-center">
                <Search className="mb-4 h-16 w-16 text-gray-400" />
                <h2 className="mb-2 text-xl font-semibold">No products found</h2>
                <p className="mb-6 text-gray-500">We couldn't find any products matching your criteria.</p>
                <Button variant="outline" onClick={resetAllFilters}>
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="block sm:hidden">
          <HorizontalScrollForShops>
            {loading
              ? Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 h-48 rounded-xl bg-gray-200 animate-pulse flex flex-col justify-between"
                    ></div>
                  ))
              : products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                  >
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={undefined}
                      image={
                        (product.images && product.images[0]) ||
                        "/placeholder.svg"
                      }
                      category={product.category}
                      isNew={product.status === "new_arrival"}
                      isSale={product.status === "on_sale"}
                    />
                  </motion.div>
                ))}
          </HorizontalScrollForShops>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>
      {/* <BottomNav activeItem="" /> */}
      <Footer />
    </Layout>
  );
};

export default ShopCategory;

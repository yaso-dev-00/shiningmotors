import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/shop/ProductCard";
import CategoryList from "@/components/shop/CategoryList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, SortDesc, Grid, List } from "lucide-react";
import { shopApi, type Product } from "@/integrations/supabase/modules/shop";
import { useToast } from "@/hooks/use-toast";
import { ProductFilters } from "@/components/shop/ProductFilters";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import HorizontalScrollCategories from "@/components/shop/HorizontalScroll";
import HorizontalScrollForShops from "@/components/homepage/HorizontalScroll";
import { motion } from "framer-motion";
import { CarouselItem } from "@/components/ui/carousel";

const PAGE_SIZE = 15;
const randomImages = [
  "https://www.garimaglobal.com/blogs/wp-content/uploads/2024/08/Used-Auto-Parts.webp",
  "https://images.unsplash.com/photo-1619468129361-605ebea04b44",
  "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
  "https://images.unsplash.com/photo-1542640244-7e672d6cef4e",
];

const productCategories = [
  { value: "oem-parts", label: "OEM Parts" },
  { value: "brakes-suspension", label: "Brakes & Suspension" },
  { value: "performance-racing-parts", label: "Performance & Racing Parts" },
  { value: "motorsports-competition", label: "Motorsports & Competition Hardware" },
  { value: "tyres-wheels", label: "Tyres & Wheels" },
  { value: "lighting-vision", label: "Lighting & Vision" },
  { value: "audio-electronics-tech", label: "Audio, Electronics & Tech" },
  { value: "interior-styling", label: "Interior Styling & Utility" },
  { value: "exterior-styling", label: "Exterior Styling & Kits" },
  { value: "car-care-detailing", label: "Car Care & Detailing" },
  { value: "garage-tools", label: "Tools, Garage & Service Equipment" },
  { value: "simracing-gaming", label: "SimRacing & Gaming Gear" },
  { value: "bike-accessories-parts", label: "Bike Accessories & Parts" },
  { value: "toys-models-collectibles", label: "Toys, Models & Collector Items" },
  { value: "apparel-merch-lifestyle", label: "Apparel, Merchandise & Lifestyle" },
  { value: "stickers-decals-wraps", label: "Stickers, Decals & Wraps" },
  { value: "books-magazines-docs", label: "Books, Magazines & Documentation" },
  { value: "vendors-storefronts", label: "Shop by Vendor / Storefronts" },
  { value: "offroad-adventure", label: "Off-Roading & Adventure Gear" },
]

const Shop = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [isInitial,setIsInitial]=useState(true)
   const debouncedSearchTerm = useDebounce(searchTerm, 500);
     useEffect(()=>{
        window.scrollTo(0,0)
     },[])
  useEffect(()=>{
      if(!isInitial)
      {

      
      setTimeout(() => {
        const element = document.getElementById('products');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
         
        }
      
      }, 100);
    }
  
    setIsInitial(false)
  },[currentPage])
  useEffect(() => {
    fetchProducts();
     
    // eslint-disable-next-line
  }, [selectedCategory, selectedStatus, sortBy, minPrice, maxPrice, currentPage,debouncedSearchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, count, error } = await shopApi.products.getFiltered({
        category: selectedCategory || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus as any,
        sortBy: sortBy as any,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
        search:debouncedSearchTerm
      });

      if (error) throw error;
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    router.push(`/shop/category/${category}`);
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/shop/category/${category}`);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const handleSortChange = (sort: string) => setSortBy(sort);

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedStatus('all');
    setCurrentPage(1);
    setSortBy('newest');
    setSelectedCategory('');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="relative h-64 bg-gray-800 md:h-80">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7"
          alt="Performance car parts"
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-sm-black/80 to-black/50">
          <div className="container mx-auto px-4">
            <div className="max-w-lg">
              <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                Performance & OEM Parts
              </h1>
              <p className="mb-6 text-gray-200">
                Browse our extensive collection of genuine OEM and high-performance parts for your vehicle.
              </p>
              {/* <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search for parts..."
                  className="h-12 bg-white pl-10 pr-4"
                  // For actual search, you would implement debounce + setSearchTerm
                  disabled
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <section className="bg-gray-50 py-5 md:py-12 ">
        <div className="container mx-auto px-4">
          <h2 className="mb-5 text-2xl font-bold">Shop by Category</h2>
          <HorizontalScrollCategories route="shop" randomImages={randomImages} categories={productCategories} ></HorizontalScrollCategories>
         
        </div>
      </section>
      <section className="py-4 md:py-8">
     
                
        <div className="container mx-auto px-4">
          <div className="mb-3 md:mb-8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name,category,sub category and parts"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            <div className="flex items-center space-x-3">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SortDesc className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          <div className="mb-8" id="products">
            <ProductFilters
              status={selectedStatus}
              onStatusChange={setSelectedStatus}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onApply={handleFilterApply}
              resetFilters={resetFilters}
            />
          </div>
          <div className="hidden max-[640px]:block">
               <HorizontalScrollForShops>
               {loading ? (
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 h-48 rounded-xl bg-gray-200 animate-pulse flex flex-col justify-between"
                  />
              
                ))
              ) :
                 products.map((product) => (
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
                    image={(product.images && product.images[0]) || '/placeholder.svg'}
                    category={product.category}
                    isNew={product.status === 'new_arrival'}
                    isSale={product.status === 'on_sale'}
                  />
                </motion.div>
                ))
               }
               </HorizontalScrollForShops>
               </div>
          {loading ? (
            <div className="hidden sm:flex items-center justify-center py-12">
              <div className="text-center text-gray-500">Loading products...</div>
            </div>
          ) : (
            <>
              <div  className={`hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 ${viewMode === "grid" ? "lg:grid-cols-3 xl:grid-cols-4" : ""}`}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={undefined}
                    image={(product.images && product.images[0]) || '/placeholder.svg'}
                    category={product.category}
                    isNew={product.status === 'new_arrival'}
                    isSale={product.status === 'on_sale'}
                  />
                ))}
              </div>
            
              <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500">No products found</p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Shop;

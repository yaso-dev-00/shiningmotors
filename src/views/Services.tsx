 "use client";

import { useState, useEffect,useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import ServiceCategories from "@/components/services/ServiceCategories";
import ServicePosts from "@/components/services/ServicePosts";
import ServicePostsCarousel from "@/components/services/ServicePostsCarousel";
import ServiceHeroCarousel from "@/components/services/ServiceHeroCarousel";
import { serviceCategories, getCategoryById } from "@/data/serviceCategories";
import { useToast } from "@/hooks/use-toast";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { ServicePost } from "@/integrations/supabase/modules/services";
import { parseServiceContent } from "@/components/services/ServicePostsCarousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HorizontalScrollForCategories from "@/components/shop/HorizontalScroll";
import Image from "next/image";
const heroSlides = [
  {
    id: 1,
    title: "Premium Automotive Services",
    subtitle: "Expert maintenance, customization, and repair services for all vehicle types",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
    primaryButton: { text: "Book Service", link: "/services/book" },

  },
  {
    id: 2,
    title: "Performance Upgrades",
    subtitle: "Transform your vehicle with professional tuning and performance enhancements",
    image: "https://images.unsplash.com/photo-1607603750909-408e193868c7",
    primaryButton: { text: "Explore Options", link: "/services/customization" },
    // secondaryButton: { text: "Learn More", link: "/about" },
  },
  {
    id: 3,
    title: "Luxury Detailing",
    subtitle: "Premium cleaning and restoration services to keep your vehicle looking its best",
    image: "https://images.unsplash.com/photo-1580274455191-1c62238fa333",
    primaryButton: { text: "Schedule Now", link: "/services/detailing" },
    // secondaryButton: { text: "View Events", link: "/events" },
  },
];
export const serviceCategoryOptions = [
  { value: "general-maintenance", label: "General Maintenance" },
  { value: "mechanical-electrical", label: "Mechanical & Electrical" },
  { value: "ac-cooling", label: "AC & Cooling Systems" },
  { value: "tyres-alignment", label: "Tyres & Alignment" },
  { value: "customization", label: "Customization & Performance" },
  { value: "diagnostics", label: "Advanced Diagnostics" },
  { value: "detailing", label: "Detailing & Painting" },
  { value: "vintage-restoration", label: "Vintage & Classic Car Restoration" },
  { value: "legal-services", label: "Legal & Government Services" },
  { value: "security", label: "Vehicle Security" },
  { value: "fleet-maintenance", label: "Fleet Maintenance" },
  { value: "electronics", label: "In-Car Electronics" },
  { value: "transport", label: "Vehicle Transport" },
  { value: "inspection", label: "Inspection & Certification" },
  { value: "emergency", label: "Emergency SOS" },
  { value: "kids-services", label: "Young Drivers & Kids" },
  { value: "driving-schools", label: "Driving Schools" },
  { value: "academy", label: "Shining Motors Academy" },
  { value: "rentals", label: "Rentals" },
  { value: "creator-access", label: "Creator Access" }
];

const randomImages = [
  "https://www.garimaglobal.com/blogs/wp-content/uploads/2024/08/Used-Auto-Parts.webp",
  "https://images.unsplash.com/photo-1619468129361-605ebea04b44",
  "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
  "https://images.unsplash.com/photo-1542640244-7e672d6cef4e",
];

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideDuration = 5000;

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    setProgress(0);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
    setProgress(0);
  };

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Progress animation
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min((elapsed / slideDuration) * 100, 100);
      setProgress(progressValue);

      if (elapsed >= slideDuration) {
        goToNextSlide();
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentSlide]);

  const slide = heroSlides[currentSlide];

  return (
    <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden bg-sm-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt="Hero"
            fill
            className="object-cover opacity-70"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sm-black/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-start justify-center p-6 text-white md:p-16 z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-lg"
            >
              <h1 className="mb-3 text-3xl font-black tracking-tight md:text-6xl">
                {currentSlide === 0 ? (
                  <>
                    {slide.title.split(" ").slice(0, -1).join(" ")}{" "}
                    <span className="text-sm-red">{slide.title.split(" ").pop()}</span>
                  </>
                ) : (
                  slide.title
                )}
              </h1>
              <p className="mb-4 text-base md:text-lg md:pr-12">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-sm-red hover:bg-sm-red-light">
                  <NextLink href={slide.primaryButton.link as any}>
                    {slide.primaryButton.text}
                  </NextLink>
                </Button>
                {/* <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-black bg-white hover:bg-white hover:text-sm-black"
                >
                 <NextLink href={slide.secondaryButton.link}>{slide.secondaryButton.text}</NextLink>
                </Button> */}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevSlide}
        className="absolute left-4 top-1/2 z-30 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNextSlide}
        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Progress bar slider */}
      <div className="absolute bottom-8 left-0 right-0 z-30 w-4/5 mx-auto">
        <div className="flex justify-between gap-2">
          {heroSlides.map((_, index) => (
            <div key={index} className="h-1.5 flex-1 bg-white/30 overflow-hidden rounded">
              {index === currentSlide && (
                <motion.div
                  className="h-full bg-white rounded"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.05 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// Sample service post data for demonstration
const generateSamplePost = (id: string, categoryId: string, isShining: boolean = false) => {
  const category = getCategoryById(categoryId);
  const username = isShining ? 'shiningmotors' : `partner_${Math.floor(Math.random() * 100)}`;
  
  return {
    id: `sample-${id}-${categoryId}`,
    content: `${category?.name} service available. ${category?.description?.split('.')[0]}.`,
    user_id: `user-${id}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    likes_count: Math.floor(Math.random() * 100),
    comments_count: Math.floor(Math.random() * 20),
    media_urls: [
      `https://source.unsplash.com/random/800x600/?car,${categoryId}`
    ],
    tags: [categoryId, 'service', 'automotive'],
    category: 'Service',
    reference_id: null,
    location: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'][Math.floor(Math.random() * 5)],
    profile: {
      id: `profile-${id}`,
      username: username,
      avatar_url: `https://avatars.dicebear.com/api/initials/${username}.svg`,
      full_name: isShining ? 'Shining Motors Official' : `Partner Service ${id}`,
    }
  };
};

// Generate 40 sample posts across categories
const generateSamplePosts = () => {
  const samplePosts = [];
  
  // Generate 2 posts for each category
  for (let i = 0; i < serviceCategories.length; i++) {
    // One from Shining Motors
    samplePosts.push(generateSamplePost(`${i}-a`, serviceCategories[i].id, true));
    
    // One from a partner
    samplePosts.push(generateSamplePost(`${i}-b`, serviceCategories[i].id, false));
  }
  
  return samplePosts;
};

interface ServicesProps {
  initialAllServices: (ServicePost | any)[];
  initialGeneralMaintenance: ServicePost[];
}

const Services = ({ initialAllServices, initialGeneralMaintenance }: ServicesProps) => {
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  
  const [priceRange, setPriceRange] = useState([0, 100]);

  // Service data from server (SSG/ISR)
  const [allServicePosts] = useState<(ServicePost | any)[]>(initialAllServices || []);
  const [GeneralMaintenance] = useState<ServicePost[]>(initialGeneralMaintenance || []);
  const isLoadingAllPosts = false;
  const isLoading = false;
  
  // Navigate to category page when a category is selected
  const handleCategoryClick = (categoryId: string) => {
    router.push(`/services/category/${categoryId}` as any);
  };
  
  // Grouped posts by category
  const groupedPosts = allServicePosts
     
  
  
  const handleSelectCategory = (categoryId: string | null) => {
    if (categoryId) {
      router.push(`/services/category/${categoryId}` as any);
    }  
  };
  
  // Filter posts based on selected category
 

  // Featured categories to showcase in carousels
  const featuredCategories = [
    { id: "customization", title: "Customization & Performance" },
    { id: "detailing", title: "Detailing & Premium Services" },
    { id: "mechanical-electrical", title: "Mechanical & Electrical Services" },
    { id: "fleet-maintenance", title: "Fleet Management" },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // All categories section with improved styling
  const renderAllCategories = () => (
    <motion.div
      className="mt-12 mb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center mb-8">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-10 h-1 bg-sm-red mr-3"
          style={{ transformOrigin: "left" }}
        ></motion.div>
        <h2 className="text-2xl font-bold text-gray-800">All Service Categories</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {serviceCategories.map((category, index) => (
          <motion.div 
            key={category.id}
            variants={itemVariants}
            className="cursor-pointer"
            onClick={() => handleCategoryClick(category.id)}
          >
            <motion.div 
              className="bg-white p-6 rounded-xl border border-gray-200 h-full shadow-sm hover:shadow-md transition-all duration-300"
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="font-bold text-lg mb-2 text-gray-800">{category.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{category.description}</p>
              <div className="mt-4">
                <Badge 
                  className="bg-red-50 hover:bg-red-100 text-sm-red border border-sm-red/20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(category.id);
                  }}
                >
                  Browse Services
                </Badge>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
        {/* Hero Section */}
        < HeroSlideshow/>
        
        <div className="container px-4 py-6 mx-auto">
          {/* Category selection */}
          {/* <motion.div 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ 
              backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%), url('https://images.unsplash.com/photo-1578474005126-89e0d4a1c173?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <ServiceCategories 
              categories={serviceCategories}
              selectedCategory={""}
              onSelectCategory={handleSelectCategory}
            />
          </motion.div> */}

<HorizontalScrollForCategories route="services" randomImages={randomImages} categories={serviceCategoryOptions} ></HorizontalScrollForCategories>
         
          
          {/* Main content area */}
          
          
            <div className="mt-6">
               <ServicePostsCarousel
                      title={"General Maintenance"}
                      posts={(GeneralMaintenance.slice(0,10) || []).map((post: ServicePost) => ({
                          // ...parseServiceContent(post),
                          ...post as any,
                        category: post.category || "general-maintenance"
                      }))}
                      isLoading={isLoading}
                      // categoryId={category.id}
                      viewAllLink={`/services/category/general-maintenance`}
                    />
                     
            </div>
          
   
            <motion.div 
              className="space-y-10 mt-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* {featuredCategories.map((category, index) => {
                const categoryPosts = groupedPosts && groupedPosts[category.id];
                return (
                  <motion.div 
                    key={category.id}
                    variants={itemVariants}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <ServicePostsCarousel
                      title={category.title}
                      posts={categoryPosts || []}
                      isLoading={isLoadingAllPosts}
                      categoryId={category.id}
                      viewAllLink={`/services/category/${category.id}`}
                    />
                  </motion.div>
                );
              })} */}
              
              {/* Recently Added Services carousel */}
              <motion.div
                variants={itemVariants}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ServicePostsCarousel
                  title="Recently Added Services"
                  posts={(allServicePosts?.slice(0, 10) || []).map((post: ServicePost | any) => {
                    if ('provider' in post) return post;
                    return {
                      ...post,
                      category: (post as ServicePost).category || "service"
                    };
                  })}
                  isLoading={isLoadingAllPosts}
                  // viewAllLink="/services"
                />
              </motion.div>
              
              {/* Popular Services */}
              <motion.div
                variants={itemVariants}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <ServicePostsCarousel
                  title="Popular Services"
                  posts={(allServicePosts || [])
                    .sort((a: ServicePost | any, b: ServicePost | any) => {
                      const aLikes = ('likes_count' in a ? a.likes_count : (a as any).likes?.length) || 0;
                      const bLikes = ('likes_count' in b ? b.likes_count : (b as any).likes?.length) || 0;
                      return bLikes - aLikes;
                    })
                    .slice(0, 6)
                    .map((post: ServicePost | any) => {
                      if ('provider' in post) return post;
                      return {
                        // ...parseServiceContent(post as ServicePost),
                        ...post,
                        category: (post as ServicePost).category || "service"
                      };
                    })}
                  isLoading={isLoadingAllPosts}
                  // viewAllLink="/services"
                />
              </motion.div>

              {/* All categories section */}
              {renderAllCategories()}
              
            </motion.div>
          
        </div>
      </div>
    </Layout>
  );
};

export default Services;

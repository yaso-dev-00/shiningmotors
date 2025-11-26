"use client";

import { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { ProductCardWrapper } from "@/components/shop/ProductCardWrapper";
import { VehicleCardWrapper } from "@/components/vehicles/VehicleCardWrapper";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PostCardWrapper from "@/components/social/PostCardWrapper";
import Layout from "@/components/Layout";
import HorizontalScrollHomePage from "@/components/homepage/HorizontalScroll";
import { useAuth } from "@/contexts/AuthContext";
import PostSkeleton from "@/lib/PostSkeleton";
import PostSkeletonForHomePage from "@/lib/postSkelitonForHomePage";
import BottomNav from "@/components/BottomNav";
import Image from "next/image";

// Hero slideshow data
const heroSlides = [
  {
    id: 1,
    title: "The Ultimate Automotive Experience",
    subtitle:
      "From luxury cars to performance parts, join our community of automotive enthusiasts.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
    primaryButton: { text: "Explore Vehicles", link: "/vehicles" },
    secondaryButton: { text: "Browse Shop", link: "/shop" },
  },
  {
    id: 2,
    title: "Premium Parts Collection",
    subtitle:
      "Upgrade your ride with our curated selection of high-performance parts.",
    image: "https://images.unsplash.com/photo-1607603750909-408e193868c7",
    primaryButton: { text: "Shop Parts", link: "/shop" },
    secondaryButton: { text: "Learn More", link: "/about" },
  },
  {
    id: 3,
    title: "Join The Community",
    subtitle:
      "Connect with fellow enthusiasts and share your automotive passion.",
    image: "https://images.unsplash.com/photo-1580274455191-1c62238fa333",
    primaryButton: { text: "Join Now", link: "/social" },
    secondaryButton: { text: "View Events", link: "/events" },
  },
];

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideDuration = 5000;
  const { user } = useAuth();

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
                    <span className="text-sm-red">
                      {slide.title.split(" ").pop()}
                    </span>
                  </>
                ) : (
                  slide.title
                )}
              </h1>
              <p className="mb-4 text-base md:text-lg md:pr-12">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-sm-red hover:bg-sm-red-light"
                >
                  <NextLink href={slide.primaryButton.link as any}>
                    {slide.primaryButton.text}
                  </NextLink>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-black bg-white hover:bg-white hover:text-sm-black"
                >
                  <NextLink href={slide.secondaryButton.link as any}>
                    {slide.secondaryButton.text}
                  </NextLink>
                </Button>
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
            <div
              key={index}
              className="h-1.5 flex-1 bg-white/30 overflow-hidden rounded"
            >
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

export const SectionHeading = ({
  title,
  linkText,
  to,
}: {
  title: string;
  linkText: string;
  to: string;
}) => (
  <div className="flex px-4 sm:px-8 flex-wrap justify-between items-center mb-1">
    <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
    <NextLink href={to as any} className="text-sm-red flex items-center hover:underline">
      {linkText} <ArrowRight size={16} className="ml-1" />
    </NextLink>
  </div>
);

// Enhanced carousel component with better transitions
const EnhancedCarousel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Carousel
      className={`w-full ${className}`}
      opts={{
        align: "start",
        loop: true,
        dragFree: true,
      }}
    >
      <CarouselContent className="-ml-2 md:-ml-4">{children}</CarouselContent>
      <div className="hidden md:block">
        <CarouselPrevious className="-left-4 md:-left-5 bg-white shadow-md hover:bg-gray-50 border border-gray-200" />
        <CarouselNext className="-right-4 md:-right-5 bg-white shadow-md hover:bg-gray-50 border border-gray-200" />
      </div>
    </Carousel>
  );
};

const POSTS_PER_PAGE = 10;

interface IndexProps {
  initialData?: {
    trendingPosts?: any[];
    featuredProducts?: any[];
    featuredVehicles?: any[];
  };
}

const Index = ({ initialData }: IndexProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // Use safe auth hook that handles missing AuthProvider gracefully
  const { user } = useSafeAuth();

  useEffect(() => {
    setIsLoaded(true);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user?.id && user.id !== userId) {
      setUserId(user.id);
    }
  }, [user?.id, userId]);

  // Use initial data from SSG, with optional client-side refetch for user-specific data
  const {
    data: homePageData,
    isLoading: isLoadingHomePage,
    error: homePageError,
  } = useQuery({
    queryKey: ["homePageData", userId],
    queryFn: async () => {
      const response = await fetch('/api/home');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      return result.data || {
        trendingPosts: [],
        featuredProducts: [],
        featuredVehicles: [],
      };
    },
    initialData: initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime renamed to gcTime in v5)
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Extract data from combined result
  const trendingPosts = homePageData?.trendingPosts || [];
  const featuredProducts = homePageData?.featuredProducts || [];
  const featuredVehicles = homePageData?.featuredVehicles || [];
  const isLoadingPosts = isLoadingHomePage && !initialData;
  const isLoadingProducts = isLoadingHomePage && !initialData;
  const isLoadingVehicles = isLoadingHomePage && !initialData;

  // Optimize animations for better performance
  const shouldAnimate = typeof window !== 'undefined' && !isMobile && window.innerWidth > 768;

  const staggerVariants: any = {
    hidden: shouldAnimate ? { opacity: 0 } : {},
    visible: (i: number) => ({
      opacity: 1,
      transition: shouldAnimate
        ? {
            delay: i * 0.05, // Reduced delay for faster loading
            duration: 0.3, // Shorter duration
          }
        : {},
    }),
  };

  return (
    <Layout>
      <main className="pb-12 md:pb-0">
        <HeroSlideshow />

        {/* Social Media Highlights */}
        <section className="py-6 pt-10 bg-gray-50">
          <div className="mx-auto">
            <SectionHeading
              title="Trending Posts"
              linkText="View All"
              to="/social"
            />
            <div className="relative w-full py-2">
              <HorizontalScrollHomePage>
                {isLoadingPosts ? (
                  Array(6) // Reduced skeleton count for faster rendering
                    .fill(0)
                    .map((_, index) => <PostSkeletonForHomePage key={index} />)
                ) : homePageError ? (
                  <div className="text-center py-10 basis-full text-red-500">
                    Failed to load posts. Please try again.
                  </div>
                ) : trendingPosts && trendingPosts.length > 0 ? (
                  trendingPosts.slice(0, 8).map(
                    (
                      post: any,
                      index: number // Reduced from 10 to 8
                    ) => (
                      <motion.div
                        key={post.id || index} // Use post.id for better React key
                        variants={staggerVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                      >
                        <PostCardWrapper post={post} />
                      </motion.div>
                    )
                  )
                ) : (
                  <div className="text-center py-10 basis-full">
                    No trending posts found
                  </div>
                )}
              </HorizontalScrollHomePage>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-6">
          <div className="mx-auto ">
            <SectionHeading
              title="Featured Parts"
              linkText="Shop All"
              to="/shop"
            />
            <HorizontalScrollHomePage>
              {isLoadingProducts ? (
                Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 h-48 bg-gray-200 rounded-xl"
                    />
                  ))
              ) : featuredProducts && featuredProducts.length > 0 ? (
                featuredProducts.slice(0, 10).map((product: any, index: number) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: isMobile ? 1.05 : 1 }}
                    whileTap={{ scale: isMobile ? 0.95 : 1 }}
                    className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                  >
                    <ProductCardWrapper product={product} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 basis-full">
                  No products found
                </div>
              )}
            </HorizontalScrollHomePage>
          </div>
        </section>

        {/* Featured Vehicles */}
        <section className="py-6 bg-gray-50">
          <div className="mx-auto">
            <SectionHeading
              title="Featured Vehicles"
              linkText="View All"
              to="/vehicles"
            />
            <HorizontalScrollHomePage>
              {isLoadingVehicles ? (
                Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 h-48 bg-gray-200 rounded-xl"
                    />
                  ))
              ) : featuredVehicles && featuredVehicles.length > 0 ? (
                featuredVehicles.slice(0, 10).map((vehicle: any, index: number) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: isMobile ? 1.05 : 1 }}
                    whileTap={{ scale: isMobile ? 0.95 : 1 }}
                    className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                  >
                    <VehicleCardWrapper vehicle={vehicle} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 basis-full">
                  No vehicles found
                </div>
              )}
            </HorizontalScrollHomePage>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-24 text-white">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1580273916550-e323be2ae537"
              alt="Car workshop"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-sm-black/75"></div>
          </div>

          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Join Our Community
                </h2>
                <p className="text-lg mb-6">
                  Connect with fellow automotive enthusiasts, discover exclusive
                  deals, and share your passion.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-sm-red hover:bg-sm-red-light"
                >
                  <NextLink href="/social">Join Now</NextLink>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </Layout>
  );
};

export default Index;

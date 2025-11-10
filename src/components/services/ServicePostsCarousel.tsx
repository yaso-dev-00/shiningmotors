
import { PostWithProfile } from "@/integrations/supabase/modules/social";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ServiceCard from "./ServiceCard";
import { ServicePost } from "@/integrations/supabase/modules/services";
import HorizontalScrollServices from "../homepage/HorizontalScroll";
interface Service{
  id: string;
  title: string;
  description: string;
  price: string;
  duration?: string;
  location: string;
  media_url?: string;
  category: string; // Added category prop
  provider: {
    name: string;
    avatar: string;
  };
}
interface ServicePostsCarouselProps {
  posts: Service[],
  title: string;
  isLoading: boolean;
  categoryId?: string;
  viewAllLink?: string;
}

// Helper function to parse service content
export const parseServiceContent = (post: ServicePost) => {
  // const lines = post.content?.split('\n') || [];
  // const title = lines[0] || '';
  
  // // Extract description
  // let descriptionLines = [];
  // let i = 2; // Start after title and first empty line
  // while (i < lines.length && !lines[i]?.startsWith('Price:') && 
  //        !lines[i]?.startsWith('Duration:') && !lines[i]?.startsWith('Availability:') &&
  //        !lines[i]?.startsWith('Contact:')) {
  //   if (lines[i]) descriptionLines.push(lines[i]);
  //   i++;
  // }
  // const description = descriptionLines.join('\n').trim();
  
  // // Extract metadata
  // const priceMatch = post.content?.match(/Price:\s*(.*)/);
  // const durationMatch = post.content?.match(/Duration:\s*(.*)/);
  
  return {
    id: post.id || '',
    title:post.title || 'Service',
    description:post.description || '',
    price:post.price || 'Contact for price',
    duration: post.duration || '',
    location: post.location || 'Location not specified',
    media_url: post.media_urls?.[0] || '',
    provider: {
      name: post.profile?.full_name || post.profile?.username || 'Unknown Provider',
      avatar: post.profile?.avatar_url || `https://avatars.dicebear.com/api/initials/${post.profile?.username || 'u'}.svg`,
    }
  };
};

const ServicePostsCarousel = ({ posts, title, isLoading, categoryId, viewAllLink }: ServicePostsCarouselProps) => {
  const router = useRouter();
  
  if (isLoading) {
    return (
      <div className="py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-[300px] flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    if (viewAllLink) {
      router.push(viewAllLink as any);
    } else if (categoryId) {
      router.push((`/services/category/${categoryId}`) as any);
    }
  };

  return (
    <motion.div 
      className="py-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-10 h-1 bg-sm-red mr-3"
            style={{ transformOrigin: "left" }}
          ></motion.div>
          <h2 className="text-[20px] md:text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        <motion.div
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            onClick={handleViewAll}
            className="border-sm-red max-[769px]:p-2 text-sm-red hover:bg-sm-red hover:text-white group transition-all duration-300"
          >
            View All 
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
      
      {/* <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full touch-pan-x"
      >
        <CarouselContent className="-ml-4">
          {posts.map((post, index) => {
            const serviceData = parseServiceContent(post);
            return (
              <CarouselItem key={post.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="h-full"
                >
                  <ServiceCard {...serviceData} />
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="-left-4 bg-white shadow-md hover:bg-gray-50 border border-gray-200" />
          <CarouselNext className="-right-4 bg-white shadow-md hover:bg-gray-50 border border-gray-200" />
        </div>
      </Carousel> */}

<HorizontalScrollServices padding="px-0 md:px-4">
                      {isLoading ? (
                           Array(4)
                           .fill(0)
                           .map((_, index) => (
                             <div key={index} className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 h-40 bg-gray-200 rounded-xl" />
                           ))
                        ) : posts && posts.length > 0 ? (
                          posts.slice(0, 10).map((serviceData,index) => (
                            <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden"
                          >
                            <ServiceCard {...parseServiceContent(serviceData)} />
                          </motion.div>
           
                          ))
                        ) : (
                          <CarouselItem className="pl-4 basis-full">
                            <div className="text-center py-10">No Serives found</div>
                          </CarouselItem>
                        )}
                      </HorizontalScrollServices>
    </motion.div>
  );
};

export default ServicePostsCarousel;

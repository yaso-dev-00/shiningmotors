
import { useState } from "react";
import { PostWithProfile } from "@/integrations/supabase/modules/social";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import ServiceCard from "./ServiceCard";
import { serviceCategories } from "@/data/serviceCategories";
// Availability type for service posts
type Availability = Record<string, any>;

interface ServicePostsProps {
  posts: PostWithProfile[];
  isLoading: boolean;
  categoryId?: string;
  categoryName?: string;
}
interface Service{
   id?: string;
    title: string;
    description: string;
    price: string;
    duration?: string;
    availability?: Availability;
    location: string;
    contact?: string;
    category:string
    media_urls?: string[];
    profile?: {
      username: string;
      full_name: string;
      avatar_url: string;
      id?:string
    }
    created_at?:string
}
// Helper function to parse service content
const parseServiceContent = (post: PostWithProfile) => {
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
  
  // // Extract category from tags
  // const categoryTag = post.tags?.find(tag => 
  //   serviceCategories.some(cat => cat.id === tag || tag.includes(cat.id))
  // );
  
  // Parse service data from post content or use post properties
  const content = post.content || '';
  const lines = content.split('\n');
  const titleMatch = lines[0]?.trim() || '';
  
  // Try to extract price, duration, location from content
  const priceMatch = content.match(/Price:\s*(.*)/i);
  const durationMatch = content.match(/Duration:\s*(.*)/i);
  const locationMatch = content.match(/Location:\s*(.*)/i);
  
  return {
    id: post.id || '',
    title: titleMatch || 'Service',
    description: content,
    price: priceMatch?.[1]?.trim() || 'Contact for price',
    duration: durationMatch?.[1]?.trim() || '',
    location: locationMatch?.[1]?.trim() || 'Location not specified',
    media_url: post.media_urls?.[0] || '',
    category: post.tags?.[0] || '',
    provider: {
      name: post.profile?.full_name || post.profile?.username || 'Unknown Provider',
      avatar: post.profile?.avatar_url || `https://avatars.dicebear.com/api/initials/${post.profile?.username || 'u'}.svg`,
    }
  };
};

const ServicePosts = ({ 
  posts, 
  isLoading, 
  categoryId, 
  categoryName 
}: ServicePostsProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  // Filter posts based on provider type
  const filteredPosts = activeTab === "all" 
    ? posts 
    : posts.filter(post => {
        if (activeTab === "shining") return post.profile?.username?.includes("shining");
        return !post.profile?.username?.includes("shining");
      });

  // Sort posts based on selected criteria
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "popular") {
      return (b.likes_count || 0) - (a.likes_count || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }


  const fadeInUpItem: any = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.div 
      className="space-y-4 md:space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {categoryId && categoryName && (
        <motion.div 
          className="mb-4 md:mb-4 bg-gradient-to-r from-red-50 to-white p-4 md:p-6 rounded-lg shadow-sm border border-red-100"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[22px] md:text-2xl font-bold text-sm-red">{categoryName}</h2>
        </motion.div>
      )}
      
     
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
        <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-4 rounded-lg shadow-sm">
          <TabsList className="mb-0 md:mb-2 bg-gray-100 max-[769px]:w-full">
           <div className="flex overflow-scroll w-full scrollbar-hide">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-sm-red data-[state=active]:text-white"
            >
              All Providers
            </TabsTrigger>
            <TabsTrigger 
              value="shining"
              className="data-[state=active]:bg-sm-red data-[state=active]:text-white"
            >
              Shining Motors
            </TabsTrigger>
            <TabsTrigger 
              value="partners"
              className="data-[state=active]:bg-sm-red data-[state=active]:text-white"
            >
              Verified Partners
            </TabsTrigger>
</div>
          </TabsList>
          <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSortBy("latest")}
            className={`${sortBy === "latest" ? "bg-sm-red text-white border-sm-red" : "bg-white"} transition-all duration-300`}
          >
            Latest
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSortBy("popular")}
            className={`${sortBy === "popular" ? "bg-sm-red text-white border-sm-red" : "bg-white"} transition-all duration-300`}
          >
            Popular
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white hover:bg-gray-50 transition-all duration-300"
          >
            {/* <Filter className="h-4 w-4 mr-1" /> Filter */}
          </Button>
        </div>
          </div>
    {
   sortedPosts.length === 0 &&
      <motion.div 
        className="text-center py-12 bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-medium">No services available</h3>
        <p className="text-gray-500 mt-2">
          There are currently no services for {categoryName || "this category"}
        </p>
      </motion.div>
    
  ||<>      
      <TabsContent value="all" className="mt-6">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {sortedPosts.map((post, index) => {
            const serviceData = parseServiceContent(post);
            console.log(serviceData)
            return (
              <motion.div
                key={post.id}
                custom={index}
                variants={fadeInUpItem}
              >
                <ServiceCard {...serviceData} />
              </motion.div>
            );
          })}
        </motion.div>
      </TabsContent>
      
      <TabsContent value="shining" className="mt-6">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {sortedPosts.map((post, index) => {
            const serviceData = parseServiceContent(post);
            return (
              <motion.div
                key={post.id}
                custom={index}
                variants={fadeInUpItem}
              >
                <ServiceCard {...serviceData} />
              </motion.div>
            );
          })}
        </motion.div>
      </TabsContent>
      
      <TabsContent value="partners" className="mt-6">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {sortedPosts.map((post, index) => {
            const serviceData = parseServiceContent(post);
            return (
              <motion.div
                key={post.id}
                custom={index}
                variants={fadeInUpItem}
              >
                <ServiceCard {...serviceData} />
              </motion.div>
            );
          })}
        </motion.div>
      </TabsContent>
    </>}
        </Tabs>
        
      
   
    </motion.div>
  );
};

export default ServicePosts;

"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import ServicePosts from "@/components/services/ServicePosts";
import { serviceCategories, getCategoryById } from "@/data/serviceCategories";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";
import { getServiceByCategory, type ServicePost } from "@/integrations/supabase/modules/services";
import { type PostWithProfile } from "@/integrations/supabase/modules/social";

const ServiceCategory = () => {
  const { category } = useParams();
  const categoryId = Array.isArray(category) ? category[0] : category;
  const router = useRouter();
  const { toast } = useToast();
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  
  // Find the category details
  const categoryData = categoryId ? getCategoryById(categoryId) : null;
  
  useEffect(() => {
    if (category && !categoryData) {
      setCategoryNotFound(true);
      toast({
        title: "Category not found",
        description: "The requested service category does not exist.",
        variant: "destructive"
      });
    }
  }, [category, categoryData, toast]);
  
  // Fetch posts for this category
  const { data: servicePosts, isLoading } = useQuery({
    queryKey: ['service', categoryId],
    queryFn: async () => {
      try {
        // Try to fetch from API
        const { data, error } = await getServiceByCategory(categoryId || '')
        if (error) throw error;
        console.log(data)
        
        // Transform ServicePost[] to PostWithProfile[]
        if (!data) return [];
        
        const transformedPosts: PostWithProfile[] = data.map((service: ServicePost) => {
          // Create content from title and description
          const content = [service.title, service.description]
            .filter(Boolean)
            .join('\n\n');
          
          return {
            id: service.id || '',
            content: content || '',
            created_at: service.created_at || new Date().toISOString(),
            updated_at: service.created_at || new Date().toISOString(),
            likes_count: 0,
            comments_count: 0,
            media_urls: service.media_urls || null,
            tags: service.category ? [service.category] : null,
            reference_id: null,
            category: 'Service' as const,
            profile: {
              id: service.profile?.id || '',
              username: service.profile?.username || null,
              avatar_url: service.profile?.avatar_url || null,
              full_name: service.profile?.full_name || null,
            },
            location: service.location || null,
            user_tag: null,
          };
        });
        
        return transformedPosts;
      } catch (error) {
        console.error("Error fetching service posts:", error);
        toast({
          title: "Error loading services",
          description: "Failed to load services. Please try again later.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !categoryNotFound && !!categoryId
  });
  console.log(servicePosts)
  // If category not found, show error state
  if (categoryNotFound) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto"
          >
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-8">
              The service category you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => router.push('/services' as any)}
              className="bg-sm-red hover:bg-sm-red-light text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Services
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-4 md:py-6">
        <div className="container mx-auto px-4">
          {/* Breadcrumb and Back Button */}
          <motion.div 
            className="mb-4 md:mb-6 flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button 
              variant="ghost" 
              className="flex items-center text-gray-600 hover:text-sm-red"
              onClick={() => router.push('/services' as any)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
             
            </Button>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-sm-red  font-medium">{categoryData?.name}</span>
          </motion.div>
          
          {/* Category Hero */}
          {categoryData && (
            <motion.div 
              className="bg-white px-4 py-5 md:p-8 rounded-xl shadow-sm border border-gray-100 mb-4 md:mb-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-sm-red opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-sm-red opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="flex items-start gap-4">
                <div className="bg-sm-red/10 p-4 rounded-full">
                  <Briefcase size={24} className="text-sm-red" />
                </div>
                <div className="flex-1">
                  <h1 className="text-[21px] md:text-3xl font-bold text-gray-900 mb-3">{categoryData.name}</h1>
                  <p className="text-gray-600 text-lg max-w-3xl">{categoryData.description}</p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Service Listings */}
          <ServicePosts 
            posts={servicePosts || []} 
            isLoading={isLoading}
            categoryId={categoryId || ""}
            categoryName={categoryData?.name}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ServiceCategory;

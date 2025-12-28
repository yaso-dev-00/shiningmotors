import { Metadata } from 'next';
import Index from "@/views/Index";
import { socialApi } from '@/integrations/supabase/modules/social';
import { shopApi } from '@/integrations/supabase/modules/shop';
import { vehiclesApi } from '@/integrations/supabase/modules/vehicles';

export const metadata: Metadata = {
  title: 'Shining Motors - Home',
  description: 'Shining Motors Social Hub - Automotive Community',
};

export const revalidate = 3600; // Revalidate every hour (ISR)

const POSTS_PER_PAGE = 10;

async function getHomeData() {
  try {
    // Directly call the functions instead of making HTTP request during build
    const [postsResult, productsResult, vehiclesResult] = await Promise.allSettled([
      socialApi.posts.getTrending("", POSTS_PER_PAGE, 0),
      shopApi.products.getFiltered({
        sortBy: "newest",
        page: 1,
        pageSize: 10,
      }),
      vehiclesApi.vehicles.getFeatured(),
    ]);

    const posts = postsResult.status === 'fulfilled' ? (postsResult.value?.data || []) : [];
    const products = productsResult.status === 'fulfilled' ? (productsResult.value?.data || []) : [];
    const vehicles = vehiclesResult.status === 'fulfilled' ? (vehiclesResult.value?.data || []) : [];

    return {
      trendingPosts: posts,
      featuredProducts: products,
      featuredVehicles: vehicles,
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    return {
      trendingPosts: [],
      featuredProducts: [],
      featuredVehicles: [],
    };
  }
}

export default async function HomePage() {
  const homeData = await getHomeData();
  
  return <Index initialData={homeData} />;
}



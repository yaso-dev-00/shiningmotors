import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { socialApi } from '@/integrations/supabase/modules/social';
import { shopApi } from '@/integrations/supabase/modules/shop';
import { vehiclesApi } from '@/integrations/supabase/modules/vehicles';

const POSTS_PER_PAGE = 10;

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    // Fetch all data in parallel
    const [postsResult, productsResult, vehiclesResult] = await Promise.all([
      socialApi.posts.getTrending("", POSTS_PER_PAGE, 0),
      shopApi.products.getFiltered({
        sortBy: "newest",
        page: 1,
        pageSize: 10,
      }),
      vehiclesApi.vehicles.getFeatured(),
    ]);

    // Handle errors gracefully
    if (postsResult.error) {
      console.error('Error fetching posts:', postsResult.error);
    }
    if (productsResult.error) {
      console.error('Error fetching products:', productsResult.error);
    }
    if (vehiclesResult.error) {
      console.error('Error fetching vehicles:', vehiclesResult.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        trendingPosts: postsResult.data || [],
        featuredProducts: productsResult.data || [],
        featuredVehicles: vehiclesResult.data || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching home page data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch home page data',
        data: {
          trendingPosts: [],
          featuredProducts: [],
          featuredVehicles: [],
        },
      },
      { status: 500 }
    );
  }
}


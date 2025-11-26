import Events from "@/views/Events";
import {
  getFeaturedEvents,
  getEventCategories,
  getUpcomingEvents,
  getPastEvents,
} from "@/integrations/supabase/modules/eventAppPage";
import { shopApi } from "@/integrations/supabase/modules/shop";
import { vehiclesApi } from "@/integrations/supabase/modules/vehicles";
import { getServiceByCategory } from "@/integrations/supabase/modules/services";
import { unstable_cache } from "next/cache";

// Time-based revalidation: regenerate events data every hour
export const revalidate = 3600; // seconds

const getEventsPageData = unstable_cache(
  async () => {
    const [
      featuredEvents,
      categories,
      upcomingEvents,
      pastEvents,
      productsResult,
      vehiclesResult,
      performanceResult,
    ] = await Promise.all([
      getFeaturedEvents(3),
      getEventCategories(),
      getUpcomingEvents(20),
      getPastEvents(20),
      shopApi.products.getFiltered({
        category: "performance-racing-parts",
        sortBy: "newest",
        page: 1,
        pageSize: 10,
      }),
      vehiclesApi.vehicles.getByCategory("performance-racing"),
      getServiceByCategory("customization"),
    ]);

    return {
      featuredEvents: featuredEvents ?? [],
      categories: categories ?? [],
      upcomingEvents: upcomingEvents ?? [],
      pastEvents: pastEvents ?? [],
      featuredProducts: (productsResult as any)?.data ?? [],
      featuredVehicles: (vehiclesResult as any)?.data ?? [],
      performanceServices: (performanceResult as any)?.data ?? [],
    };
  },
  ["events-page-data"],
  {
    revalidate: 3600,
    tags: ["events"],
  }
);

export default async function Page() {
  const {
    featuredEvents,
    categories,
    upcomingEvents,
    pastEvents,
    featuredProducts,
    featuredVehicles,
    performanceServices,
  } = await getEventsPageData();

  return (
    <Events
      featuredEvents={featuredEvents}
      categories={categories}
      upcomingEvents={upcomingEvents}
      pastEvents={pastEvents}
      featuredProducts={featuredProducts}
      featuredVehicles={featuredVehicles}
      performanceServices={performanceServices}
    />
  );
}


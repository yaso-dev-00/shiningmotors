import Shop from "@/views/Shop";
import { unstable_cache } from "next/cache";
import { shopApi } from "@/integrations/supabase/modules/shop";

// Time-based revalidation: regenerate shop data every hour
export const revalidate = 3600; // seconds

const getShopPageData = unstable_cache(
  async () => {
    // Fetch initial products data (first page, no filters)
    const productsResult = await shopApi.products.getFiltered({
      page: 1,
      pageSize: 15,
      sortBy: "newest",
    });

    return {
      initialProducts: productsResult.data ?? [],
      initialTotalCount: productsResult.count ?? 0,
    };
  },
  ["shop-page-data"],
  {
    revalidate: 3600,
    tags: ["shop"],
  }
);

export default async function Page() {
  const { initialProducts, initialTotalCount } = await getShopPageData();

  return (
    <Shop 
      initialProducts={initialProducts} 
      initialTotalCount={initialTotalCount}
    />
  );
}




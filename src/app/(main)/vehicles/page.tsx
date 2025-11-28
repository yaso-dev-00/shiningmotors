import Vehicles from "@/views/Vehicles";
import { unstable_cache } from "next/cache";
import { vehiclesApi, type ExtendedVehicle } from "@/integrations/supabase/modules/vehicles";
import { Suspense } from "react";
// Time-based revalidation: regenerate vehicles data every hour
export const revalidate = 3600; // seconds

const getVehiclesPageData = unstable_cache(
  async () => {
    // Fetch initial vehicles data (first page, no filters)
    const vehiclesResult = await vehiclesApi.vehicles.select()
      .order("created_at", { ascending: false })
      .range(0, 14); // First 15 items

    return {
      initialVehicles: (vehiclesResult.data ?? []) as ExtendedVehicle[],
    };
  },
  ["vehicles-page-data"],
  {
    revalidate: 3600,
    tags: ["vehicles"],
  }
);

export default async function Page() {
  const { initialVehicles } = await getVehiclesPageData();

  return (
    <Suspense>
    <Vehicles initialVehicles={initialVehicles} />
    </Suspense>
  );
}



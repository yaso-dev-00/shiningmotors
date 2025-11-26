import Services from "@/views/Services";
import { unstable_cache } from "next/cache";
import { getAllServices, getServiceByCategory } from "@/integrations/supabase/modules/services";

// Time-based revalidation: regenerate services data every hour
export const revalidate = 3600; // seconds

const getServicesPageData = unstable_cache(
  async () => {
    const [allServicesResult, generalMaintenanceResult] = await Promise.all([
      getAllServices(),
      getServiceByCategory("general-maintenance"),
    ]);

    return {
      allServices: allServicesResult.data ?? [],
      generalMaintenance: generalMaintenanceResult.data ?? [],
    };
  },
  ["services-page-data"],
  {
    revalidate: 3600,
    tags: ["services"],
  }
);

export default async function Page() {
  const { allServices, generalMaintenance } = await getServicesPageData();
    console.log(allServices)
  return (
    <Services
      initialAllServices={allServices}
      initialGeneralMaintenance={generalMaintenance}
    />
  );
}


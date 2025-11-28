import VendorDashboard from "@/views/vendor/VendorDashboard";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <VendorDashboard />
    </Suspense>
  );
}





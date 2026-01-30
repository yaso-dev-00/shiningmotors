import { ProtectedRoute } from "@/components/ProtectedRoute";
import MyServiceBookings from "@/views/MyServiceBookings";
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default function Page() {
  return (
    <ProtectedRoute>
      <MyServiceBookings />
    </ProtectedRoute>
  );
}






import { ProtectedRoute } from "@/components/ProtectedRoute";
import Wishlist from "@/views/Wishlist";
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default function Page() { 
  return (
    <ProtectedRoute>
      <Wishlist />
    </ProtectedRoute>
  );
}






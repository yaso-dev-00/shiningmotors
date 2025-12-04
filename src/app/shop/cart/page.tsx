import ShopCart from "@/views/ShopCart";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <ShopCart />
    </ProtectedRoute>
  );
}






import { ProtectedRoute } from "@/components/ProtectedRoute";
import OrderHistory from "@/views/OrderHistory";

export default function Page() {
  return (
    <ProtectedRoute>
      <OrderHistory />
    </ProtectedRoute>
  );
}





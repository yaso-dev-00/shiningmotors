
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EventHistory from "@/views/EventHistory";

export default function Page() {
  return (
    <ProtectedRoute>
      <EventHistory />
    </ProtectedRoute>
  );
}



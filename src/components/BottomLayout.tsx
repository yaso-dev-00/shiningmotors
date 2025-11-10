import BottomNav from "@/components/BottomNav";
import { usePathname } from "next/navigation";
import FloatingQuickSettings from "./FloatingButton";
import { FiMessageSquare } from "react-icons/fi";

function BottomLayout() {
  const pathname = usePathname() ?? "/";
  const isMessengerScreen = pathname.startsWith("/messenger");

  return (
    <>
      {/* Page content should render before this component; no Outlet in App Router */}
      <BottomNav />
      <div className="lg:hidden">
        <FloatingQuickSettings />
        {!isMessengerScreen && (
          <div className="fixed right-4 bottom-20 z-50">
            <button
              onClick={() => (window.location.href = "/messenger")}
              className="bg-red-800 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
              aria-label="Open Messenger"
            >
              <FiMessageSquare size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default BottomLayout;

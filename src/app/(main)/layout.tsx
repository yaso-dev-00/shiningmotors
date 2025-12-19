"use client";

import BottomNav from "@/components/BottomNav";
import FloatingQuickSettings from "@/components/FloatingButton";
import { RouteRemember } from "@/components/RouteRemember";
import { FiMessageSquare } from "react-icons/fi";
import { usePathname } from "next/navigation";

export default function MainLayout({ 
  children,
  modal,
}: { 
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessengerScreen = pathname?.startsWith("/messenger");

  return (
    <>
      <RouteRemember />
      {children}
      {modal}
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





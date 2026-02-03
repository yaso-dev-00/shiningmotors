"use client";

import BottomNav from "@/components/BottomNav";
import FloatingQuickSettings from "@/components/FloatingButton";
import { RouteRemember } from "@/components/RouteRemember";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import { AIProvider } from "@/contexts/AIContext";
import { FiMessageSquare } from "react-icons/fi";
import { usePathname } from "next/navigation";

export default function MainLayout({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessengerScreen = pathname?.startsWith("/messenger");

  return (
    <AIProvider>
      <RouteRemember />
      {children}
      <BottomNav />
      <AIChatAssistant />
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
    </AIProvider>
  );
}





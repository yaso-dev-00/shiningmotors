"use client";

import BottomNav from "@/components/BottomNav";
import FloatingQuickSettings from "@/components/FloatingButton";
import { RouteRemember } from "@/components/RouteRemember";
import { FiMessageSquare } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { AIChatAssistant } from "@/components/AIChatAssistant";

export default function MainLayout({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessengerScreen = pathname?.startsWith("/messenger");

  return (
    <>
      <RouteRemember />
      {children}
      <BottomNav />
      <AIChatAssistant />
      <div className="lg:hidden">
        <FloatingQuickSettings />
      </div>
    </>
  );
}





"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import MainNavigation from "./MainNavigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationsDropdown } from "./notifications/NotificationsDropdown";
import { useNotifications } from "./notifications/NotificationProvider";
import { UserDropdown } from "./header/UserDropdown";
import { CartButton } from "./header/CartButton";
import { MobileNavigation } from "./header/MobileNavigation";
import { DesktopNavigation } from "./header/DesktopNavigation";
import { useMyContext } from "@/contexts/GlobalContext";
import Image from "next/image";
const Header = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();
  const ctx = useMyContext();
  const isDrag = ctx?.isDrag ?? false;
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthPage = pathname === "/auth";
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  // Check screen size for tablet/mobile detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkScreenSize = () => {
      setIsTabletOrMobile(window.innerWidth < 1025);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let startY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      if (isDrag) return;
      startY = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDrag) return;

      const currentY = event.touches[0].clientY;
      const deltaY = currentY - startY;

      if (Math.abs(deltaY) < 10) return;

      if (deltaY > 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      startY = currentY;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDrag]);

  const glassClasses =
    "backdrop-blur-md bg-white/70 border-b border-white/10 shadow-sm";

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.header
            className={`sticky top-0 z-50 w-full bg-white`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <div className="container  mx-auto flex h-16 items-center  px-4 max-[426px]:pl-1">
              <div className="flex items-center md:flex-1">
                <MobileNavigation {...{ isSidebarOpen, setIsSidebarOpen }} />
                <DesktopNavigation />
              </div>

              {/* Center: Logo + Search (desktop), Logo only (mobile) */}
              <div className="flex flex-1 items-center justify-center">
                {/* Desktop: show logo + search side-by-side */}
                <div className="hidden md:flex items-center gap-4 w-full px-4">
                  <NextLink href="/" className="flex items-center">
                    <div className="w-[150px] h-16 relative">
                      <Image
                        src="/shiningMotors.jpg"
                        alt="logo"
                        fill
                        className="object-cover"
                        sizes="150px"
                        priority
                      />
                    </div>
                  </NextLink>
                  <div className="w-full max-w-[720px]">
                    <GlobalSearch isMobile={isTabletOrMobile} />
                  </div>
                </div>

                {/* Mobile: show logo only here (search appears below MainNavigation) */}
                <div className="md:hidden flex flex-1 md:justify-center justify-center">
                  <NextLink href="/" className="flex items-center">
                    <div className="w-[120px] h-16 relative">
                      <Image
                        src="/shiningMotors.jpg"
                        alt="logo"
                        fill
                        className="object-cover"
                        sizes="120px"
                        priority
                      />
                    </div>
                  </NextLink>
                </div>
              </div>

              <div className="flex sm:flex-0 items-center justify-end space-x-0">
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => navigate("/search")}
                >
                  <Search size={22} />
                </Button> */}

                {isAuthenticated && (
                  <NotificationsDropdown
                    notifications={notifications.slice(0, 5)}
                    unreadCount={unreadCount}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                  />
                )}

                {isAuthenticated ? (
                  <UserDropdown />
                ) : (
                  !isAuthPage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 hidden max-[375px]:block lg:inline-flex text-black"
                      onClick={() => router.push("/auth")}
                    >
                      Login
                    </Button>
                  )
                )}

                {!pathname?.startsWith("/admin") && <CartButton />}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {isVisible && typeof window !== 'undefined' && !window.location.pathname.includes("/admin") && (
        <>
          <MainNavigation />
          {/* Mobile search below main navigation */}
          <div className="md:hidden px-4 py-2 bg-white border-b">
            <GlobalSearch isMobile />
          </div>
        </>
      )}
    </>
  );
};

export default Header;

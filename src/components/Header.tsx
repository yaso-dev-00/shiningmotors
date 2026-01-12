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
  const path = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();
  const ctx = useMyContext();
  const isDrag = ctx?.isDrag ?? false;
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
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
    
    // Only apply scroll-based visibility on mobile
    const isMobileDevice = window.innerWidth < 1025;
    if (!isMobileDevice) {
      setIsVisible(true);
      return;
    }

    let lastScrollY = window.scrollY;
    let lastScrollX = window.scrollX;
    let isHorizontalScrolling = false;
    let touchStartX = 0;
    let touchStartY = 0;
    const scrollThreshold = 10; // Minimum scroll distance to trigger visibility change

    // Track touch events to detect horizontal scrolling on containers
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      
      // Check if the target or its parent has horizontal scroll
      let element: Element | null = target;
      while (element && element !== document.body) {
        const computedStyle = window.getComputedStyle(element);
        const hasHorizontalScroll = computedStyle.overflowX === 'auto' || 
                                   computedStyle.overflowX === 'scroll' ||
                                   computedStyle.overflowX === 'overlay';
        const scrollWidth = element.scrollWidth;
        const clientWidth = element.clientWidth;
        const canScrollHorizontally = scrollWidth > clientWidth;
        
        if (hasHorizontalScroll && canScrollHorizontally) {
          isHorizontalScrolling = true;
          break;
        }
        element = element.parentElement;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isHorizontalScrolling) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);
      
      // If movement is primarily horizontal, keep the flag
      if (deltaX > deltaY && deltaX > 10) {
        isHorizontalScrolling = true;
      } else if (deltaY > deltaX && deltaY > 10) {
        // If movement becomes primarily vertical, reset
        isHorizontalScrolling = false;
      }
    };

    const handleTouchEnd = () => {
      // Reset after a short delay to allow scroll to complete
      setTimeout(() => {
        isHorizontalScrolling = false;
      }, 150);
    };

    const handleScroll = () => {
      if (isDrag) return;
      
      // Ignore if user is scrolling horizontally on a container
      if (isHorizontalScrolling) {
        return;
      }
      
      // Don't hide header if any dropdown or sidebar is open
      if (isSidebarOpen || isUserDropdownOpen || isNotificationDropdownOpen) {
        setIsVisible(true);
        lastScrollY = window.scrollY;
        lastScrollX = window.scrollX;
        return;
      }

      const currentScrollY = window.scrollY;
      const currentScrollX = window.scrollX;
      const verticalScrollDiff = Math.abs(currentScrollY - lastScrollY);
      const horizontalScrollDiff = Math.abs(currentScrollX - lastScrollX);

      // Ignore if horizontal scrolling is dominant (window-level horizontal scroll)
      if (horizontalScrollDiff > verticalScrollDiff && horizontalScrollDiff > 5) {
        lastScrollY = currentScrollY;
        lastScrollX = currentScrollX;
        return;
      }

      // Only update if vertical scroll difference is significant
      if (verticalScrollDiff < scrollThreshold) {
        return;
      }

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceFromTop = currentScrollY;
      const distanceFromBottom = documentHeight - (currentScrollY + windowHeight);
      const edgeThreshold = 100; // Show both navs when within 100px of top or bottom

      // At or near the top of the page, always show header
      if (distanceFromTop <= edgeThreshold) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        lastScrollX = currentScrollX;
        return;
      }

      // At or near the bottom of the page, always show header
      if (distanceFromBottom <= edgeThreshold) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        lastScrollX = currentScrollX;
        return;
      }

      // Scrolling down (towards bottom) → show header
      if (currentScrollY > lastScrollY) {
        setIsVisible(true);
      } 
      // Scrolling up (towards top) → hide header
      else if (currentScrollY < lastScrollY) {
        setIsVisible(false);
      }

      lastScrollY = currentScrollY;
      lastScrollX = currentScrollX;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDrag, isSidebarOpen, isUserDropdownOpen, isNotificationDropdownOpen]);

  // Keep header visible when any dropdown or sidebar is open
  useEffect(() => {
    if (isSidebarOpen || isUserDropdownOpen || isNotificationDropdownOpen) {
      setIsVisible(true);
    }
  }, [isSidebarOpen, isUserDropdownOpen, isNotificationDropdownOpen]);

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
                    open={isNotificationDropdownOpen}
                    onOpenChange={setIsNotificationDropdownOpen}
                  />
                )}

                {isAuthenticated ? (
                  <UserDropdown 
                    open={isUserDropdownOpen}
                    onOpenChange={setIsUserDropdownOpen}
                  />
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
    
      {isVisible && !path.includes("/admin") && (
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

import { useEffect, useState, useRef } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Gamepad, Wrench, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMyContext } from "@/contexts/GlobalContext";
import { useQueryClient } from "@tanstack/react-query";
import CreatePost from "../components/social/CreatePost";
import MobileCreatePost from "./social/MobileCreatePost";
import { toast } from "@/components/ui/use-toast";

interface BottomNavProps {
  activeItem?:
    | "home"
    | "services"
    | "events"
    | "sim-racing"
    | "profile"
    | "about"
    | "";
}

const BottomNav = ({ activeItem }: BottomNavProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useIsMobile();
  const pathname = usePathname() ?? "/";
  const ctx = useMyContext();
  const isDrag = ctx?.isDrag ?? false;
  const setDrag = ctx?.setDrag ?? (() => {});
  const queryClient = useQueryClient();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobilePostFiles, setMobilePostFiles] = useState<File[] | null>(null);
  const [showMobileCreatePost, setShowMobileCreatePost] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    if (showMobileCreatePost) {
      setDrag(true);
      setIsVisible(true); // Keep nav visible when creating post
      return;
    } else {
      setDrag(false);
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

      // At or near the top of the page, always show bottom nav
      if (distanceFromTop <= edgeThreshold) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        lastScrollX = currentScrollX;
        return;
      }

      // At or near the bottom of the page, always show bottom nav
      if (distanceFromBottom <= edgeThreshold) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        lastScrollX = currentScrollX;
        return;
      }

      // Scrolling up (towards top) → show bottom nav
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } 
      // Scrolling down (towards bottom) → hide bottom nav
      else if (currentScrollY > lastScrollY) {
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
  }, [isDrag, isMobile, showMobileCreatePost]);

  // Prevent background scroll when CreatePost modal is open (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    if (isCreatePostModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCreatePostModalOpen, isMobile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const rejected: string[] = [];
    // Validate all files before adding
    for (const file of files) {
      if (file.type.startsWith("video/")) {
        if (file.size > 30 * 1024 * 1024) {
          rejected.push(`Video '${file.name}' exceeds 30MB size limit.`);
          continue;
        }
        // Check video duration
        const url = URL.createObjectURL(file);
        const duration = await new Promise<number>((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => {
            resolve(video.duration);
            URL.revokeObjectURL(url);
          };
          video.src = url;
        });
        if (duration > 60) {
          rejected.push(
            `Video '${file.name}' exceeds 1 minute duration limit.`
          );
          continue;
        }
      } else if (file.type.startsWith("image/")) {
        if (file.size > 20 * 1024 * 1024) {
          rejected.push(`Image '${file.name}' exceeds 20MB size limit.`);
          continue;
        }
      }
    }
    if (rejected.length > 0) {
      setTimeout(() => {
        toast({
          description: rejected.join("\n"),
          variant: "destructive",
        });
      }, 300);
      return;
    }
    setMobilePostFiles(files);
    setShowMobileCreatePost(true);
    // Reset input so user can re-select same file if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Don't render on non-mobile devices
  if (!isMobile) return null;

  // Glass effect classes for bottom navigation
  const glassClasses =
    "backdrop-blur-md bg-white/70 border-t border-white/10 shadow-lg";
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-0 left-0 z-50 w-full ${glassClasses}`}
          initial={{ y: 100 }}
          animate={{
            opacity: isVisible ? 1 : 0.5,
            y: isVisible ? 0 : 72,
          }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="mx-auto  grid h-16 max-w-lg grid-cols-5">
            <NavButton
              to="/"
              icon={<Home />}
              label="home"
              isActive={activeItem === "home" || pathname == "/"}
            />

            <NavButton
              to="/services"
              icon={<Wrench />}
              label="Services"
              isActive={activeItem === "services" || pathname == "/services"}
            />

            <div
              className="col-span-1 flex items-center justify-center"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = "";
                fileInputRef.current?.click();
              }}
            >
              <motion.div
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-sm-red text-white shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusSquare className="h-7 w-7" />
              </motion.div>
            </div>

            <NavButton
              to="/events"
              icon={<Calendar />}
              label="Events"
              isActive={activeItem === "events" || pathname == "/events"}
            />

            <NavButton
              to="/sim-racing"
              icon={<Gamepad />}
              label="SR"
              isActive={activeItem === "sim-racing" || pathname == "/sim-racing"}
            />
          </div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          {showMobileCreatePost && mobilePostFiles && (
            <MobileCreatePost
              open={showMobileCreatePost}
              onClose={() => {
                setShowMobileCreatePost(false);
                setMobilePostFiles(null);
              }}
              initialFiles={mobilePostFiles}
              postCreated={(newPost) => {
                // Invalidate and refetch posts queries to show the new post immediately
                queryClient.invalidateQueries({
                  queryKey: ["posts", "trending"],
                });
                queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
                queryClient.invalidateQueries({
                  queryKey: ["posts", "following"],
                });
                queryClient.invalidateQueries({ queryKey: ["trendingPosts"] });

                // The query invalidation above will automatically refetch and show the new post
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced NavButton component with animations
type NavButtonProps = { to: string; icon: React.ReactNode; label: string; isActive: boolean };
const NavButton: React.FC<NavButtonProps> = ({ to, icon, label, isActive }) => {
  return (
    <NextLink
      href={to as any}
      className={cn(
        "group inline-flex flex-col items-center justify-center px-5",
        isActive ? "text-sm-red" : "text-gray-500"
      )}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 1.25 }}
        className={`relative flex flex-col items-center`}
      >
        {isActive ? (
          <motion.div
            className="mb-1 h-6 w-6 text-sm-red"
            whileHover={{ scale: 1.5 }}
            animate={{
              y: [0, -3, 0],
              rotate: isActive ? [0, -5, 5, 0] : 0,
            }}
            transition={{
              y: {
                repeat: isActive ? Infinity : 0,
                duration: 2,
                repeatType: "mirror",
              },
              rotate: {
                repeat: isActive ? Infinity : 0,
                duration: 1.5,
                repeatDelay: 0.5,
              },
            }}
          >
            {icon}
          </motion.div>
        ) : (
          <div className="mb-1 h-6 w-6 group-hover:text-sm-red transition-colors">
            {icon}
          </div>
        )}
        <span className="text-xs group-hover:text-sm-red transition-colors">
          {label}
        </span>
      </motion.div>
    </NextLink>
  );
};

export default BottomNav;

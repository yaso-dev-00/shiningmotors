"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress
if (typeof window !== "undefined") {
  NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.08,
    easing: "ease",
    speed: 500,
  });
}

export default function ProgressBar() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Only show progress bar if pathname actually changed
    if (prevPathnameRef.current !== null && prevPathnameRef.current === pathname) {
      // Same pathname, don't show progress bar
      return;
    }

    // Update previous pathname
    prevPathnameRef.current = pathname;

    // Start progress bar when route changes
    NProgress.start();

    // Complete progress bar after navigation is complete
    const handleComplete = () => {
      NProgress.done();
    };

    // Use a small delay to ensure the route change is processed
    const timer = setTimeout(() => {
      handleComplete();
    }, 150);

    // Also listen for when the page is fully loaded
    if (typeof window !== "undefined") {
      window.addEventListener("load", handleComplete);
    }

    return () => {
      clearTimeout(timer);
      NProgress.done();
      if (typeof window !== "undefined") {
        window.removeEventListener("load", handleComplete);
      }
    };
  }, [pathname]);

  // Intercept link clicks to show progress bar immediately
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (link && link.href) {
        const href = link.getAttribute("href");
        // Only show progress for internal links and if it's a different path
        if (href && (href.startsWith("/") || href.startsWith(window.location.origin))) {
          // Extract pathname from href
          let targetPath = href;
          if (href.startsWith(window.location.origin)) {
            targetPath = new URL(href).pathname;
          }
          
          // Only start progress if navigating to a different path
          if (targetPath !== pathname) {
            NProgress.start();
          }
        }
      }
    };

    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, [pathname]);

  return null;
}


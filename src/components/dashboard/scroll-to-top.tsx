"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Ensure scroll restoration is manual so the browser doesn't try to restore previous scroll positions
    if (typeof window !== "undefined" && "history" in window) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Reset window scroll on navigation instantly to avoid visual smooth-scrolling jumps
    window.scrollTo(0, 0);
    
    // Also try scrolling any nested scrollable parent containers to the top instantly
    const scrollContainers = document.querySelectorAll(".overflow-y-auto");
    scrollContainers.forEach((container) => {
      container.scrollTo(0, 0);
    });
  }, [pathname]);

  return null;
}


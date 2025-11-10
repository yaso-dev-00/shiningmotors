import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
  padding?: string;
}

const HorizontalScrollForCards = ({ children, padding }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const router = useRouter();

  // Handle scroll index calculation
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !container.firstElementChild) return;

    const handleScroll = () => {
      const cardWidth =
        (container.firstElementChild as HTMLElement).offsetWidth + 16;
      const index = Math.round(container.scrollLeft / cardWidth);
      setCurrentIndex(index);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Count total slides on mount or when children change
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      setTotalSlides(container.childElementCount);
    }
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container || !container.firstElementChild) return;

    const firstElement = container.firstElementChild as HTMLElement;
    const cardWidth = firstElement.offsetWidth + 16;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    if (direction === "left") {
      if (container.scrollLeft <= 0) {
        container.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      } else {
        container.scrollBy({ left: -cardWidth, behavior: "smooth" });
      }
    } else {
      if (container.scrollLeft >= maxScrollLeft - 5) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative w-full py-0">
      {/* <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-[45%] transform -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow md:hidden"
      >
        <ChevronLeft size={24} />
      </button> */}

      <motion.div
        ref={scrollRef}
        className={`flex flex-nowrap gap-4 overflow-x-auto md:py-5 scrollbar-hide ${
          padding ?? "px-4 sm:px-8 "
        }`}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 50 }}
      >
        {children}
      </motion.div>
      {/* 
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-[45%] transform -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow md:hidden"
      >
        <ChevronRight size={24} />
      </button> */}

      {/* Dot Indicators - only show if more than 1 slide */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-3 md:hidden">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 mx-1 rounded-full transform transition-all duration-300 ease-in-out ${
                index === currentIndex
                  ? "bg-sm-red scale-125"
                  : "bg-gray-400 scale-100"
              }`}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HorizontalScrollForCards;

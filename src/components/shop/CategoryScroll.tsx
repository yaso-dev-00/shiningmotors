import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryData } from "@/data/products";

interface CategoryScrollProps {
  categories: string[];
  scrollAmount?: number;
  selected?:string;
  handleClick?:(text:string)=> void;
  activeColor?:string

}

export default function CategoryScroll({
  categories,
  selected,
  handleClick,
  scrollAmount = 200,
  activeColor="bg-black text-white border-black"
  
}: CategoryScrollProps) {

  const scrollRef = useRef<HTMLDivElement>(null);
 
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollValue = dir === "left" ? -scrollAmount : scrollAmount;
    scrollRef.current.scrollBy({ left: scrollValue, behavior: "smooth" });
  };
 
  
 
  return (
    <>
    <motion.div
      className="relative w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Arrows for mobile */}
      {/* <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 md:hidden">
        <button onClick={() => scroll("left")} className="bg-white shadow p-1 rounded-full">
          <ChevronLeft />
        </button>
      </div>
      <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 md:hidden">
        <button onClick={() => scroll("right")} className="bg-white shadow p-1 rounded-full">
          <ChevronRight />
        </button>
      </div> */}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 py-2 scroll-smooth scrollbar-hide"
      >
        {categories.map((category) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={category}
            onClick={() => handleClick?.(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full border text-sm transition-all
              ${selected === category
                ? activeColor
                : "bg-white text-black border-gray-300"}`}
          >
            {category}
          </motion.button>
        ))}
      </div>
    </motion.div>
    </>
    
  );
}

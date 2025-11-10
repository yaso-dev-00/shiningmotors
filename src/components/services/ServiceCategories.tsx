
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  description: string;
}

interface ServiceCategoriesProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const ServiceCategories = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: ServiceCategoriesProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      
      if (direction === "left") {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative w-full">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button 
          onClick={() => scroll("left")}
          size="icon"
          variant="outline"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-200 hidden md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </motion.div>
      
      <ScrollArea className="w-full pb-2">
        <div 
          className="flex space-x-2 p-1 pb-3 overflow-x-auto scrollbar-hide touch-pan-x" 
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          ref={scrollRef}
        >
          <motion.div
            key="all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(null)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Badge
              className={`px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-sm-red text-white hover:bg-sm-red-light shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              All Services
            </Badge>
          </motion.div>
          
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category.id;
            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCategory(category.id)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Badge
                  className={`px-4 py-2 text-sm cursor-pointer whitespace-nowrap transition-all duration-300 ${
                    isSelected
                      ? "bg-sm-red text-white hover:bg-sm-red-light shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  {category.name}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
      
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button 
          onClick={() => scroll("right")}
          size="icon"
          variant="outline"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-200 hidden md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ServiceCategories;

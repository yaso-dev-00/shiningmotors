
import React, { useEffect } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventCategoriesProps {
  categories: string[];
  className?: string;
  isSimRacing?: boolean;
}

const EventCategories: React.FC<EventCategoriesProps> = ({ 
  categories, 
  className = "",
  isSimRacing = false 
}) => {
  const currentPath = usePathname() ?? "/";
  const currentCategory = currentPath.includes('/category/') 
    ? currentPath.split("/category/")[1]
    : "";
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
 
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <NextLink
        href={isSimRacing ? "/sim-racing" : "/events"}
        className={cn(
          "px-4 py-1 rounded-full text-sm font-medium transition-colors",
          !currentCategory
            ? "bg-sm-red text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        All {isSimRacing ? "Sim Racing" : "Events"}
      </NextLink>
      
      {categories.map((category) => (
        <NextLink
          key={category}
          href={`${isSimRacing ? "/sim-racing" : "/events"}/category/${category}`}
          className={cn(
            "px-4 py-1 rounded-full text-sm font-medium transition-colors",
            currentCategory.replace("%20"," ") === category
              ? "bg-sm-red text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {category}
        </NextLink>
      ))}
    </div>
  );
};

export default EventCategories;

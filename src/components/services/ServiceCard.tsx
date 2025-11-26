
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, Star, MessageSquare, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { getCategoryById } from "@/data/serviceCategories";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  duration?: string;
  location: string;
  media_url?: string;
  category?: string; // Added category prop
  provider: {
    name: string;
    avatar: string;
  };
}

const ServiceCard = ({
  id,
  title,
  description,
  price,
  duration,
  location,
  media_url,
  category, // Using the new category prop
  provider
}: ServiceCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  console.log(provider)
  // Get category details if available
  const categoryData = category ? getCategoryById(category) : null;
  
  const handleClick = () => {
    router.push(`/services/${id}`);
  };
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className="h-full"
    >
      <Card 
        className="overflow-hidden border border-gray-200 transition-all h-full flex flex-col bg-white hover:shadow-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
          boxShadow: isHovered 
            ? "rgba(0, 0, 0, 0.1) 0px 10px 20px, rgba(0, 0, 0, 0.1) 0px 3px 6px" 
            : "rgba(0, 0, 0, 0.05) 0px 1px 3px"
        }}
      >
        {/* Service Image with 3D effect on hover */}
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          {media_url ? (
            <motion.img 
              src={media_url} 
              alt={title} 
              className="w-full h-full object-cover"
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotateY: isHovered ? 5 : 0
              }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              No Image
            </div>
          )}
          
          {/* Price Badge with animation */}
          <motion.div 
            className="absolute top-3 right-3"
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              y: isHovered ? -2 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <Badge className="bg-sm-red text-white px-3 py-1 text-sm font-medium shadow-md">
              {price?.startsWith('₹') ? price : `₹${price}`}
            </Badge>
          </motion.div>
          
          {/* Category Badge if available */}
          {categoryData && (
            <motion.div 
              className="absolute top-3 left-3"
              animate={{ 
                scale: isHovered ? 1.1 : 1,
                y: isHovered ? -2 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <Badge className="bg-white/80 backdrop-blur-sm text-sm-red border border-sm-red/20 px-2 py-1 text-xs font-medium shadow-sm flex items-center">
                <Tag size={12} className="mr-1" />
                {categoryData.name}
              </Badge>
            </motion.div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold line-clamp-1 text-gray-800">{title}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin size={14} className="mr-1 text-sm-red" />
                <span className="text-sm text-gray-500 truncate">{location}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow max-[769px]:pb-2">
          <p className="text-gray-600 line-clamp-3 text-sm">{description}</p>
          
          {duration && (
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <Clock size={15} className="mr-2 text-sm-red" />
              <span>{duration}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t py-3 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center">
            <Avatar className="h-7 w-7 mr-2 ring-2 ring-sm-red/10">
              <AvatarImage src={provider.avatar} />
              <AvatarFallback>{provider.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate max-w-[120px]">{provider.name}</span>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/services/${id}`);
            }}
          >
            <Button 
              size="sm"
              variant="outline" 
              className="border-sm-red text-sm-red hover:bg-sm-red hover:text-white transition-all duration-300"
            >
              Book Now
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ServiceCard;

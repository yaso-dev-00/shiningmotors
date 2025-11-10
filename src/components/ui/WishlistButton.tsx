
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface WishlistButtonProps {
  itemId: string;
  itemType: 'product' | 'vehicle';
  variant?: 'default' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const WishlistButton = ({ 
  itemId, 
  itemType, 
  variant = 'default',
  size = 'default',
  className 
}: WishlistButtonProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(itemId, itemType);

 const [isProcessing, setIsProcessing] = useState(false);


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const handleClick = async (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (isProcessing) return;

  setIsProcessing(true);

  try {
    if (inWishlist) {
      await removeFromWishlist(itemId, itemType);
    } else {
      await addToWishlist(itemId, itemType);
    }
 
    await delay(1000);
  } finally {
    setIsProcessing(false);
  }
};


  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(
          "h-8 w-8 hover:bg-red-100 bg-white rounded-full",
          className
        )}
        disabled={isProcessing}
      >
        <Heart
          size={16}
          className={cn(
            "transition-colors",
            inWishlist ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={inWishlist ? "default" : "outline"}
      size={size}
      onClick={handleClick}
      className={cn(
        inWishlist 
          ? "bg-red-500 hover:bg-red-600 text-white" 
          : "border-red-500 text-red-500 hover:bg-red-50",
        className
      )}
      disabled={isProcessing}
    >
      
      {inWishlist ? "In Wishlist" : "Add to Wishlist"}
    </Button>
  );
};

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
  const { addToWishlist, removeFromWishlist, wishlistItems } = useWishlist();
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize itemId to string for consistent comparison
  const normalizedItemId = String(itemId);
  const normalizedItemType = itemType.toLowerCase() as 'product' | 'vehicle';

  // Calculate inWishlist directly from wishlistItems to ensure reactivity
  const inWishlist = wishlistItems.some(
    (item) => String(item.item_id) === normalizedItemId && item.item_type === normalizedItemType
  );

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (inWishlist) {
        await removeFromWishlist(normalizedItemId, normalizedItemType);
      } else {
        await addToWishlist(normalizedItemId, normalizedItemType);
      }
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
          "h-8 w-8 hover:bg-red-100 bg-white rounded-full transition-colors",
          className
        )}
        disabled={isProcessing}
      >
        <Heart
          size={16}
          className={cn(
            "transition-colors duration-300",
            inWishlist 
              ? "fill-red-500 text-red-500 stroke-red-500" 
              : "fill-none stroke-gray-400 text-gray-400"
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

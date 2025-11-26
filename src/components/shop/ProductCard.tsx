
import { ShoppingCart } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { WishlistButton } from "../ui/WishlistButton";
import Image from "next/image";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  isNew = false,
  isSale = false,
}: ProductCardProps) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = async () => {
    // Fix: Pass a proper product object with all required properties
    await addToCart({
      id,
      name,
      price,
      images: [image],
    }, 1);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <div className="product-card group animate-zoom-in h-full">
      <div className="relative overflow-hidden h-60">
        <NextLink href={`/shop/product/${id}`}>
          <Image
            src={image || '/placeholder.svg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
          />
        </NextLink>

        <div className="absolute left-2 top-2 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-blue-500 text-xs font-bold uppercase">New</Badge>
          )}
          {isSale && (
            <Badge className="bg-sm-red text-xs font-bold uppercase">Sale</Badge>
          )}
        </div>

        {/* <button
          className={`absolute right-2 top-2 rounded-full bg-white p-2 text-gray-700 shadow-md transition-colors ${!isWishlist?'hover:bg-sm-red':''} hover:text-white`}
          onClick={toggleWishlist}
        >
          <Heart className={isWishlist ? "fill-sm-red text-sm-red" : ""} size={16} />
        </button> */}
         <div className="absolute top-2 right-2">
            <WishlistButton 
             className={`absolute right-2 top-2 rounded-full bg-white p-2 text-gray-700 shadow-md transition-colors `}
        
              itemId={id}
              itemType="product"
              variant="icon"
            />
          </div>

        <div className="invisible absolute bottom-0 left-0 w-full translate-y-full bg-black/80 p-2 text-center text-white transition-all duration-300 group-hover:visible group-hover:translate-y-0">
          <button
            className="w-full py-1 text-sm font-medium"
            onClick={handleAddToCart}
          >
            Add to cart
          </button>
        </div>
      </div>

      <div className="p-4">
        <NextLink
          href={`/shop/product/${id}`}
          className="block text-sm text-gray-500 hover:text-sm-red"
        >
          {category}
        </NextLink>
        <NextLink href={`/shop/product/${id}`} className="block">
          <h3 className="mb-2 mt-1 text-lg font-medium transition-colors hover:text-sm-red">
            {name}
          </h3>
        </NextLink>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg font-bold">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="bg-sm-black hover:bg-sm-red text-white"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

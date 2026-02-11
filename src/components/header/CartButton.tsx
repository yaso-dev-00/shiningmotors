import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

export const CartButton = () => {
  const { cartItems } = useCart();
  const itemCount = cartItems.length; // Count unique items instead of total quantity

  return (
    <Link href="/shop/cart" prefetch={true} className="inline-block">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full relative hidden min-[375px]:block p-[10px]"
      >
        <ShoppingCart size={22} />
        {itemCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-sm-red text-white text-xs">
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
};

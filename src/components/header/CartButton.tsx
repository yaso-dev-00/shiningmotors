import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

export const CartButton = () => {
  const router = useRouter();
  const { cartItems } = useCart();
  const itemCount = cartItems.length; // Count unique items instead of total quantity

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full relative hidden min-[375px]:block p-[10px]"
      onClick={() => router.push("/shop/cart")}
    >
      <ShoppingCart size={22} />
      {itemCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-sm-red text-white text-xs">
          {itemCount}
        </Badge>
      )}
    </Button>
  );
};

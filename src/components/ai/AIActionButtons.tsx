"use client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, MapPin, Package, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface ActionButton {
  type: "navigate" | "add_to_cart" | "search" | "book_service";
  label: string;
  path?: string;
  productId?: string;
  serviceId?: string;
  query?: string;
  icon?: string;
}

interface AIActionButtonsProps {
  actions: ActionButton[];
  onActionComplete?: () => void;
}

export const AIActionButtons = ({ actions, onActionComplete }: AIActionButtonsProps) => {
  const router = useRouter();
  const { addToCart } = useCart();

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "cart":
        return <ShoppingCart className="h-4 w-4" />;
      case "calendar":
        return <Calendar className="h-4 w-4" />;
      case "map":
        return <MapPin className="h-4 w-4" />;
      case "package":
        return <Package className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      default:
        return <ArrowRight className="h-4 w-4" />;
    }
  };

  const handleAction = async (action: ActionButton) => {
    try {
      switch (action.type) {
        case "navigate":
          if (action.path) {
            router.push(action.path as any);
            onActionComplete?.();
          }
          break;

        case "add_to_cart":
          if (action.productId) {
            // TODO: Fetch product and add to cart
            // For now, navigate to product page
            router.push(`/shop/product/${action.productId}`);
            onActionComplete?.();
          }
          break;

        case "search":
          if (action.query) {
            router.push(`/search?q=${encodeURIComponent(action.query)}`);
            onActionComplete?.();
          }
          break;

        case "book_service":
          if (action.serviceId) {
            router.push(`/services/${action.serviceId}`);
            onActionComplete?.();
          }
          break;

        default:
          console.warn("Unknown action type:", action.type);
      }
    } catch (error) {
      console.error("Error executing action:", error);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          size="sm"
          variant="outline"
          onClick={() => handleAction(action)}
          className="text-xs"
        >
          {getIcon(action.icon)}
          <span className="ml-1">{action.label}</span>
        </Button>
      ))}
    </div>
  );
};



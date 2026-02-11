import { useMemo, RefObject } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import {
  RazorpayPayment,
  RazorpayPaymentRef,
} from "@/components/payment/RazorpayPayment";

interface CartSummaryProps {
  className?: string;
  onCheckout?: () => void;
  checkoutButtonText?: string;
  isCheckoutDisabled?: boolean;
  hideCheckoutButton?: boolean;
  hasAddress?: boolean;
  onPay?: () => void;
  isSubmitting?: boolean;
  // Razorpay payment props
  orderId?: string | null;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
  onPaymentClose?: () => void;
  paymentRef?: RefObject<RazorpayPaymentRef>;
}

const CartSummary = ({
  className = "",
  onCheckout,
  checkoutButtonText = "Proceed to Checkout",
  isCheckoutDisabled = false,
  hideCheckoutButton = false,
  hasAddress = true,
  onPay,
  isSubmitting = false,
  orderId,
  userInfo,
  onPaymentSuccess,
  onPaymentError,
  onPaymentClose,
  paymentRef,
}: CartSummaryProps) => {
  const { cartItems, calculateTotal, validateInventory } = useCart();

  const subtotal = calculateTotal();

  // Calculate tax based on each product's GST percentage
  const tax = useMemo(() => {
    return cartItems.reduce((totalTax, item) => {
      const itemSubtotal = item.price * item.quantity;
      const gstPercentage = item.gst_percentage || 0; // Default to 0 if not provided
      const itemTax = (itemSubtotal * gstPercentage) / 100;
      return totalTax + itemTax;
    }, 0);
  }, [cartItems]);

  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping + tax;

  const itemCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const isEmpty = cartItems.length === 0;
  const inventoryValidation = validateInventory();
  const hasOutOfStockItems = inventoryValidation.outOfStockItems.length > 0;

  return (
    <div className={`rounded-lg border p-6 ${className}`}>
      <h2 className="mb-4 text-lg font-medium">Order Summary</h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          {subtotal > 100 ? (
            <span className="text-green-600">Free</span>
          ) : (
            <span>{formatPrice(shipping)}</span>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span>GST</span>
          <span>{formatPrice(tax)}</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="mb-6 flex justify-between font-medium">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {onPay && (
        <>
          <Button
            onClick={onPay}
            disabled={
              isSubmitting || isEmpty || !hasAddress || hasOutOfStockItems
            }
            className="w-full bg-sm-red hover:bg-sm-red-light"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              `Pay ${formatPrice(total)}`
            )}
          </Button>

          {orderId && (
            <div className="mt-4">
              <RazorpayPayment
                ref={paymentRef}
                amount={total}
                orderId={orderId}
                userInfo={userInfo || {}}
                onSuccess={onPaymentSuccess || (() => {})}
                onError={onPaymentError || (() => {})}
                onClose={onPaymentClose || (() => {})}
                showButton={false}
              />
            </div>
          )}

          {!hasAddress && !isEmpty && (
            <p className="mt-2 text-center text-xs text-red-600">
              Please add a shipping address to continue
            </p>
          )}
          {hasOutOfStockItems && (
            <p className="mt-2 text-center text-xs text-red-600">
              Please remove out of stock items to continue
            </p>
          )}
        </>
      )}

      {!hideCheckoutButton && !onPay && (
        <Button
          onClick={onCheckout}
          disabled={isCheckoutDisabled || isEmpty || hasOutOfStockItems}
          className="w-full bg-sm-red hover:bg-sm-red-light"
        >
          {isCheckoutDisabled ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {checkoutButtonText}
            </>
          ) : (
            <>
              {checkoutButtonText} <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}

      {subtotal > 100 && (
        <p className="mt-3 text-center text-xs text-green-600">
          You've qualified for free shipping!
        </p>
      )}
    </div>
  );
};

export default CartSummary;

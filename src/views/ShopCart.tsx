"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";
import Layout from "@/components/Layout";
import CartSummary from "@/components/shop/CartSummary";

const ShopCart = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    isLoading,
    fetchCartItems,
    canIncreaseQuantity,
  } = useCart();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  useEffect(() => {
    // Fix async function directly in useEffect
    const loadCartItems = async () => {
      try {
        await fetchCartItems();
      } catch (error) {
        console.error("Error loading cart items:", error);
      }
    };

    loadCartItems();
  }, []);

  // Reset navigation state when component unmounts or navigation completes
  useEffect(() => {
    return () => {
      if (isNavigatingToCheckout) {
        setIsNavigatingToCheckout(false);
        NProgress.done();
      }
    };
  }, [isNavigatingToCheckout]);

  const handleUpdateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    // Find the current item to check if quantity is the same
    const currentItem = cartItems.find(item => item.id === itemId);
    if (currentItem && currentItem.quantity === quantity) {
      // Quantity hasn't changed, no need to call API
      // Just clear input value if it exists
      setInputValues(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      return;
    }

    setIsUpdating((prev) => ({ ...prev, [itemId]: true }));
    await updateQuantity(itemId, quantity);
    setIsUpdating((prev) => ({ ...prev, [itemId]: false }));
    // Clear input value so it shows the updated quantity
    setInputValues(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  }, [updateQuantity, cartItems]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    setIsUpdating((prev) => ({ ...prev, [itemId]: true }));
    await removeFromCart(itemId);
    setIsUpdating((prev) => ({ ...prev, [itemId]: false }));
  }, [removeFromCart]);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before proceeding to checkout",
        variant: "destructive",
      });
      return;
    }

    // Show loading state and progress bar
    setIsNavigatingToCheckout(true);
    NProgress.start();
    
    // Navigate to checkout
    router.push("/shop/checkout" as any);
    
    // Progress bar will complete when navigation finishes (handled by ProgressBar component)
    // Reset loading state after a delay as fallback
    setTimeout(() => {
      setIsNavigatingToCheckout(false);
    }, 2000);
  }, [cartItems.length, toast, router]);

  const handleContinueShopping = useCallback(() => {
    router.push("/shop" as any);
  }, [router]);

  // Memoize cart items with computed values
  const memoizedCartItems = useMemo(() => {
    return cartItems.map((item) => {
      const inventory = item.inventory || 0;
      const isOutOfStock = inventory === 0;
      const isLowStock = inventory < 5 && inventory > 0;
      const canIncrease = canIncreaseQuantity(item.id);
      const itemTotal = item.price * item.quantity;
      const displayValue = inputValues[item.id] !== undefined ? inputValues[item.id] : item.quantity.toString();
      
      return {
        ...item,
        inventory,
        isOutOfStock,
        isLowStock,
        canIncrease,
        itemTotal,
        displayValue,
      };
    });
  }, [cartItems, inputValues, canIncreaseQuantity]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium">Loading your cart...</h2>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-5">
        <h1 className="text-3xl font-bold">Your Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button onClick={handleContinueShopping}>Continue Shopping</Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              {!isAuthenticated && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You're not logged in. Your cart will be saved locally but to
                    checkout, you'll need to{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm-red"
                      onClick={() => router.push("/auth" as any)}
                    >
                      sign in
                    </Button>
                    .
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border">
                <div className="bg-gray-50 p-4 hidden sm:block">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                    <div className="col-span-6">Product</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-end">Total</div>
                  </div>
                </div>

                <div className="divide-y">
                  {memoizedCartItems.map((item) => {
                    const { inventory, isOutOfStock, isLowStock, canIncrease, displayValue, itemTotal } = item;

                    return (
                      <div
                        key={item.id}
                        className={`grid grid-row-12 sm:grid-cols-12 gap-4 p-4 items-center ${
                          isOutOfStock
                            ? "bg-red-50 border-l-4 border-red-400"
                            : isLowStock
                            ? "bg-yellow-50 border-l-4 border-yellow-400"
                            : ""
                        }`}
                      >
                        <div className="col-span-6 flex  gap-4">
                          <div
                            className="h-20 w-20 flex-shrink-0 rounded-md border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              router.push(`/shop/product/${item.product_id}` as any)
                            }
                          >
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex sm:flex-col justify-between sm:justify-normal w-full">
                            <div>
                              <h3
                                className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() =>
                                  router.push(`/shop/product/${item.product_id}` as any)
                                }
                              >
                                {item.name}
                              </h3>
                              {isOutOfStock && (
                                <div className="flex items-center mt-1 text-red-600 text-sm">
                                  <X className="h-4 w-4 mr-1" />
                                  Out of Stock
                                </div>
                              )}
                              {isLowStock && !isOutOfStock && (
                                <div className="flex items-center mt-1 text-yellow-600 text-sm">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Only {inventory} left in stock
                                </div>
                              )}
                            </div>
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-sm text-red-600 hover:text-red-800"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isUpdating[item.id]}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 text-left sm:text-center">
                          {formatPrice(item.price)}
                        </div>

                        <div className="col-span-4 sm:col-span-2 flex justify-end sm:justify-normal ">
                          <div className="flex items-center justify-center relative">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-r-none relative z-0"
                              onClick={() => {
                                const newQuantity = item.quantity - 1;
                                if (newQuantity >= 1 && newQuantity !== item.quantity) {
                                  handleUpdateQuantity(item.id, newQuantity);
                                }
                              }}
                              disabled={
                                item.quantity <= 1 || isUpdating[item.id]
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={displayValue}
                              onKeyDown={(e) => {
                                // Prevent decimal point, minus, plus, and 'e' (scientific notation)
                                // Allow backspace, delete, arrow keys, tab, etc.
                                if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'].includes(e.key)) {
                                  return;
                                }
                                if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                // Remove any decimal points or invalid characters, but allow empty
                                const cleanedValue = inputValue.replace(/[^\d]/g, '');
                                
                                // Update local state to allow clearing
                                setInputValues(prev => ({
                                  ...prev,
                                  [item.id]: cleanedValue
                                }));
                                
                                // Only update cart if we have a valid number >= 1 and it's different from current
                                if (cleanedValue !== '' && cleanedValue !== '0') {
                                  const value = parseInt(cleanedValue);
                                  if (!isNaN(value) && value >= 1 && value !== item.quantity) {
                                    handleUpdateQuantity(item.id, value);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const inputValue = e.target.value.replace(/[^\d]/g, '');
                                const value = parseInt(inputValue);
                                
                                // If empty or invalid, restore to current quantity
                                if (isNaN(value) || value < 1 || inputValue === '') {
                                  setInputValues(prev => {
                                    const newState = { ...prev };
                                    delete newState[item.id];
                                    return newState;
                                  });
                                  // Ensure cart has at least quantity 1
                                  if (item.quantity < 1) {
                                    handleUpdateQuantity(item.id, 1);
                                  }
                                } else if (value !== item.quantity) {
                                  // Valid value and different from current, ensure it's synced
                                  handleUpdateQuantity(item.id, value);
                                  // Clear local state to use the synced value
                                  setInputValues(prev => {
                                    const newState = { ...prev };
                                    delete newState[item.id];
                                    return newState;
                                  });
                                } else {
                                  // Value is same as current, just clear input state
                                  setInputValues(prev => {
                                    const newState = { ...prev };
                                    delete newState[item.id];
                                    return newState;
                                  });
                                }
                              }}
                              onFocus={(e) => {
                                // Select all text on focus for easy replacement
                                e.target.select();
                              }}
                              className="h-8 w-12 rounded-none border-x-0 p-0 text-center relative z-10 focus:z-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-offset-0"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-l-none relative z-0"
                              onClick={() => {
                                const newQuantity = item.quantity + 1;
                                if (newQuantity !== item.quantity && canIncrease) {
                                  handleUpdateQuantity(item.id, newQuantity);
                                }
                              }}
                              disabled={isUpdating[item.id] || !canIncrease}
                              title={
                                !canIncrease
                                  ? `Only ${inventory} available in stock`
                                  : ""
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="col-span-3 sm:col-span-2 sm:text-end font-medium">
                          <span className="inline-block sm:hidden">
                            Total :
                          </span>{" "}
                          {formatPrice(itemTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={handleContinueShopping}>
                  Continue Shopping
                </Button>
              </div>
            </div>

            <div className="md:col-span-1">
              <CartSummary 
                onCheckout={handleCheckout} 
                isCheckoutDisabled={isNavigatingToCheckout}
                checkoutButtonText={isNavigatingToCheckout ? "Navigating..." : "Proceed to Checkout"}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShopCart;

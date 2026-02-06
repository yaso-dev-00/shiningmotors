"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import CartSummary from "@/components/shop/CartSummary";
import AddressSelector from "@/components/shop/AddressSelector";
import { RazorpayPayment } from "@/components/payment/RazorpayPayment";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { StripePaymentForm } from "@/components/shop/StripePaymentForm"; // COMMENTED OUT FOR TESTING

const Checkout = () => {
  const [selectedAddressId, setSelectedAddressId] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "razorpay" | "stripe" | "elements"
  >("razorpay");
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { cartItems, addresses, clearCart, validateInventory, isLoading: cartLoading } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [defaultAddress, setDefaultAddress] = useState({});

  // Ref to trigger payment programmatically
  const paymentRef = useRef<{ triggerPayment: () => void }>(null);

  useEffect(() => {
    // Set default address if available
    const defaultAddress = addresses.find((addr) => addr.is_default);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      setDefaultAddress(defaultAddress);
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id);
      setDefaultAddress(addresses[0]);
    } else {
      // No addresses available, reset selection
      setSelectedAddressId(undefined);
      setDefaultAddress({});
    }
  }, [addresses]);

  // Additional check to ensure selectedAddressId is valid
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const addressExists = addresses.find(
        (addr) => addr.id === selectedAddressId
      );
      if (!addressExists) {
        // Selected address no longer exists, reset selection
        setSelectedAddressId(undefined);
        setDefaultAddress({});
      }
    }
  }, [selectedAddressId, addresses]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = addresses.find((addr) => addr.id === addressId);
    if (selected) {
      setDefaultAddress(selected);
    }
  };

  // Use the same calculation as CartSummary
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate tax based on each product's GST percentage (same as CartSummary)
  const tax = cartItems.reduce((totalTax, item) => {
    const itemSubtotal = item.price * item.quantity;
    const gstPercentage = item.gst_percentage || 0;
    const itemTax = (itemSubtotal * gstPercentage) / 100;
    return totalTax + itemTax;
  }, 0);

  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping + tax;

  // STRIPE PAYMENT FUNCTIONS COMMENTED OUT FOR TESTING
  /*
  const handleCreatePaymentIntent = async () => {
    if (!selectedAddressId) {
      toast({
        title: "No address selected",
        description: "Please add or select a shipping address",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // First create the order in database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          shipping_address: defaultAddress,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // Create payment intent
      const { data, error } = await supabase.functions.invoke(
        "create-payment-intent",
        {
          body: {
            amount: Math.round(total * 100), // Convert to cents
            orderId: orderData.id,
            cartItems,
            shippingAddress: defaultAddress,
          },
        }
      );

      if (error) throw error;

      setClientSecret(data.clientSecret);
      setOrderId(orderData.id);
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast({
        title: "Error",
        description: "Failed to prepare payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  // STRIPE CHECKOUT FUNCTION COMMENTED OUT FOR TESTING
  /*
  const handleStripeCheckout = async () => {
    try {
      setIsSubmitting(true);

      const subtotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      const shipping = subtotal > 100 ? 0 : 9.99;
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + shipping + tax;

      // Create the order first
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          shipping_address: defaultAddress,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const { data: simProducts } = await simRacingApi.shop.getProducts();
      const productsIds = simProducts.map((item) => item.id);
      const orderItems = cartItems.map((item) => {
        if (!productsIds.includes(item.product_id)) {
          return {
            order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          };
        } else {
          return {
            order_id: orderData.id,
            simProduct_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          };
        }
      });

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke(
        "create-stripe-checkout",
        {
          body: {
            cartItems,
            shippingAddress: defaultAddress,
            totalAmount: total,
            orderId: orderData.id,
          },
        }
      );

      if (error) throw error;

      // Update order with stripe session ID
      await supabase
        .from("orders")
        .update({ stripe_session_id: data.sessionId })
        .eq("id", orderData.id);

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  // Razorpay order creation
  const handleCreateOrder = async () => {
    if (!selectedAddressId) {
      toast({
        title: "No address selected",
        description: "Please add or select a shipping address",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    // Validate inventory before proceeding
    const inventoryValidation = validateInventory();
    if (!inventoryValidation.isValid) {
      toast({
        title: "Out of Stock Items",
        description:
          "Please remove out of stock items from your cart before proceeding",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the order in database with pending status
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          shipping_address: defaultAddress,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // Set order ID for payment
      setOrderId(orderData.id);

      toast({
        title: "Order Created",
        description: "Redirecting to payment...",
      });

      // Automatically trigger payment after a short delay
      setTimeout(() => {
        if (paymentRef.current) {
          paymentRef.current.triggerPayment();
        }
      }, 1000);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    toast({
      title: "Payment Successful!",
      description: "Your order has been placed successfully.",
    });

    await clearCart();
    router.push(
      `/shop/payment-success?order_id=${orderId}&payment_id=${paymentId}`
    );
  };

  const handlePaymentError = async (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });

    setOrderId(null);
  };

  const handlePaymentClose = () => {
    setOrderId(null);
  };

  // Show loading state while auth or cart is loading
  if (authLoading || cartLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-gray-900 mb-4" />
              <h2 className="text-xl font-medium">Loading checkout...</h2>
              <p className="text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Only check authentication after loading is complete
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <div className="mt-10 p-6 text-center border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Please sign in to continue
            </h2>
            <p className="mb-6">
              You need to be logged in to complete your purchase.
            </p>
            <Button
              onClick={() =>
                router.push("/auth?redirect=/shop/checkout" as any)
              }
            >
              Sign In
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Only check cart after loading is complete
  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <div className="mt-10 p-6 text-center border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="mb-6">
              Add some products to your cart before checking out.
            </p>
            <Button onClick={() => router.push("/shop" as any)}>Continue Shopping</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold">Checkout</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Accordion
              type="single"
              defaultValue="shipping"
              collapsible
              className="w-full"
            >
              <AccordionItem
                value="shipping"
                className="border rounded-lg mb-4"
              >
                <AccordionTrigger className="px-4 py-2">
                  <span className="font-medium">Shipping Address</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <AddressSelector
                    selectedAddressId={selectedAddressId}
                    onSelect={handleAddressSelect}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="items" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2">
                  <span className="font-medium">Order Items</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const inventory = item.inventory || 0;
                      const isOutOfStock = inventory === 0;
                      const isLowStock = inventory < 5 && inventory > 0;

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-4 p-3 rounded-lg border ${
                            isOutOfStock
                              ? "border-red-200 bg-red-50"
                              : isLowStock
                              ? "border-yellow-200 bg-yellow-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div
                            className="h-16 w-16 flex-shrink-0 rounded-md border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
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
                          <div className="flex-1">
                            <h3
                              className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() =>
                                router.push(`/shop/product/${item.product_id}` as any)
                              }
                            >
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
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
                          <div className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inventory warnings */}
                  {(() => {
                    const inventoryValidation = validateInventory();
                    if (inventoryValidation.outOfStockItems.length > 0) {
                      return (
                        <Alert className="mt-4 border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong>Cannot proceed:</strong>{" "}
                            {inventoryValidation.outOfStockItems.length} item(s)
                            are out of stock. Please remove them from your cart.
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    if (inventoryValidation.lowStockItems.length > 0) {
                      return (
                        <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Low stock warning:</strong>{" "}
                            {inventoryValidation.lowStockItems.length} item(s)
                            have limited availability.
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* STRIPE CODE COMMENTED OUT FOR TESTING
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4">Payment Method</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={paymentMethod === "stripe" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("stripe")}
                    className="flex-1"
                  >
                    Stripe Checkout
                  </Button>
                  <Button
                    variant={paymentMethod === "elements" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("elements")}
                    className="flex-1"
                  >
                    Card Payment
                  </Button>
                </div>

                {paymentMethod === "stripe" && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-gray-500 mb-4">
                      Use Stripe's hosted checkout page for secure payment processing.
                    </p>
                    <Button
                      onClick={handleStripeCheckout}
                      disabled={isSubmitting || !selectedAddressId || cartItems.length === 0}
                      className="w-full"
                    >
                      {isSubmitting ? "Creating checkout..." : "Proceed to Stripe Checkout"}
                    </Button>
                  </div>
                )}

                {paymentMethod === "elements" && (
                  <div className="rounded-lg border p-4">
                    {!clientSecret ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-4">
                          Use our integrated payment form powered by Stripe Elements.
                        </p>
                        <Button
                          onClick={handleCreatePaymentIntent}
                          disabled={isSubmitting || !selectedAddressId || cartItems.length === 0}
                          className="w-full"
                        >
                          {isSubmitting ? "Preparing payment..." : "Prepare Payment"}
                        </Button>
                      </div>
                    ) : (
                      <StripePaymentForm
                        clientSecret={clientSecret}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        amount={total}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            */}
          </div>

          <div className="md:col-span-1">
            <CartSummary
              hideCheckoutButton
              hasAddress={!!selectedAddressId}
              onPay={handleCreateOrder}
              isSubmitting={isSubmitting}
              orderId={orderId}
              userInfo={{
                name: user?.user_metadata?.full_name,
                email: user?.email,
                phone: user?.user_metadata?.phone,
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onPaymentClose={handlePaymentClose}
              paymentRef={paymentRef}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/utils";
import Layout from "@/components/Layout";
import { PurchaseTracker } from "@/components/notifications/PurchaseTracker";

const PaymentSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("order_id");
  // COMMENTED OUT STRIPE CODE - use direct order_id from checkout
  // const sessionId = searchParams.get("session_id");
  // const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (orderId) {
          // Direct order verification (no Stripe needed for testing)
          const { data: orderData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (error) throw error;

          setPaymentDetails({
            orderId: orderData.id,
            amount: orderData.total
          });
          await clearCart();
          
          toast({
            title: "Order Successful!",
            description: "Your order has been placed successfully.",
          });
        } else {
          throw new Error("No order ID found");
        }

        // COMMENTED OUT STRIPE CODE
        /*
        if (sessionId) {
          // Verify Stripe Checkout session
          const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
            body: { sessionId },
          });

          if (error) throw error;

          if (data.success) {
            setPaymentDetails(data);
            await clearCart();
            
            toast({
              title: "Payment Successful!",
              description: "Your order has been placed successfully.",
            });
          } else {
            throw new Error("Payment verification failed");
          }
        } else if (paymentIntentId) {
          // Verify Payment Intent (for Stripe Elements)
          const { data, error } = await supabase.functions.invoke('verify-payment-intent', {
            body: { paymentIntentId },
          });

          if (error) throw error;

          if (data.success) {
            setPaymentDetails(data);
            await clearCart();
            
            toast({
              title: "Payment Successful!",
              description: "Your order has been placed successfully.",
            });
          } else {
            throw new Error("Payment verification failed");
          }
        } else {
          throw new Error("No payment session found");
        }
        */
      } catch (error) {
        console.error("Error verifying order:", error);
        setError("Failed to verify order. Please contact support.");
        toast({
          title: "Order Verification Error",
          description: "There was an issue verifying your order. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  if (isVerifying) {
    return (
      <Layout>
        <div className="container mx-auto py-20">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sm-red"></div>
            <h2 className="text-xl font-medium">Verifying your order...</h2>
            <p className="text-gray-500">Please wait while we confirm your order.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto py-20">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-medium text-red-600">Order Verification Failed</h2>
            <p className="text-gray-500 text-center max-w-md">{error}</p>
            <div className="flex space-x-4">
              <Button onClick={() => router.push("/shop/orders" as any)} variant="outline">
                View Orders
              </Button>
              <Button onClick={() => router.push("/shop" as any)}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Order Successful!</h1>
            <p className="text-gray-600">Thank you for your order. We've received your order and will process it shortly.</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Order Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{paymentDetails?.orderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatPrice(paymentDetails?.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">Direct Order</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmed
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>What's Next?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-sm-red rounded-full flex items-center justify-center text-white text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Order Confirmation</p>
                    <p className="text-sm text-gray-600">You'll receive an email confirmation shortly</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Processing</p>
                    <p className="text-sm text-gray-600">We'll prepare your order for shipment</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Shipping</p>
                    <p className="text-sm text-gray-600">Your order will be shipped within 2-3 business days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => router.push("/shop/orders" as any)} className="flex-1">
              View Order History
            </Button>
            <Button onClick={() => router.push("/shop" as any)} variant="outline" className="flex-1">
              Continue Shopping
            </Button>
          </div>
        </div>
        
        {/* Track purchase for notifications */}
        {paymentDetails?.orderId && (
          <PurchaseTracker 
            orderId={paymentDetails.orderId}
            products={[]} // Will be populated from order items
          />
        )}
      </div>
    </Layout>
  );
};

export default PaymentSuccess;

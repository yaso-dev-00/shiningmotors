import { useState, forwardRef, useImperativeHandle } from "react";
import { useToast } from "@/hooks/use-toast";
import { RazorpayService } from "@/services/razorpayService";
import {
  initializeRazorpay,
  RAZORPAY_CONFIG,
  RazorpayOptions,
  RazorpayResponse,
  validateRazorpayConfig,
  TEST_MODE_CONFIG,
} from "@/lib/razorpay";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

// Extended Razorpay instance interface
interface RazorpayInstanceWithEvents {
  open(): void;
  on(event: string, callback: (data?: unknown) => void): void;
}

// Ref interface for programmatic control
export interface RazorpayPaymentRef {
  triggerPayment: () => void;
}

interface RazorpayPaymentProps {
  amount: number;
  orderId: string;
  userInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  showButton?: boolean;
}

export const RazorpayPayment = forwardRef<
  RazorpayPaymentRef,
  RazorpayPaymentProps
>(
  (
    {
      amount,
      orderId,
      userInfo,
      onSuccess,
      onError,
      onClose,
      showButton = false,
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Expose triggerPayment method to parent component
    useImperativeHandle(ref, () => ({
      triggerPayment: handlePayment,
    }));

    const handlePayment = async () => {
      setIsLoading(true);
      try {
        // Validate Razorpay configuration
        if (!validateRazorpayConfig()) {
          throw new Error(
            "Razorpay configuration is missing. Please check your environment variables. Make sure VITE_RAZORPAY_KEY_ID is set in your .env file."
          );
        }

        // Check amount limits for test mode
        if (TEST_MODE_CONFIG.enabled) {
          const amountInPaise = Math.round(amount * 100);
          const maxTestAmount = TEST_MODE_CONFIG.maxAmount * 100; // Convert to paise

          if (amountInPaise > maxTestAmount) {
            throw new Error(
              `Amount ₹${amount.toFixed(2)} exceeds test mode limit of ₹${
                TEST_MODE_CONFIG.maxAmount
              }. Please use a smaller amount for testing or switch to live mode.`
            );
          }
        }

        // Step 1: Create Razorpay order first
        console.log("Creating Razorpay order...");
        console.log("Order details:", {
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: `order_${orderId}`,
          orderId: orderId,
        });

        const razorpayOrder = await RazorpayService.createOrder({
          amount: Math.round(amount * 100), // Convert to paise
          currency: "INR",
          receipt: `order_${orderId}`,
          notes: {
            orderId: orderId,
            userId: userInfo.name || "Guest",
          },
        });

        console.log("Razorpay order created:", razorpayOrder);

        if (!razorpayOrder || !razorpayOrder.id) {
          console.error(
            "Razorpay order creation failed. Response:",
            razorpayOrder
          );
          console.error(
            "Available fields in response:",
            Object.keys(razorpayOrder || {})
          );
          throw new Error(
            "Failed to create Razorpay order - no order ID returned. Please check your Razorpay configuration and Supabase function."
          );
        }

        // Step 2: Initialize Razorpay and show payment UI
        const Razorpay = await initializeRazorpay();
        if (!Razorpay) {
          throw new Error("Failed to load Razorpay");
        }

        const options: RazorpayOptions = {
          key: RAZORPAY_CONFIG.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: RAZORPAY_CONFIG.name,
          description: RAZORPAY_CONFIG.description,
          order_id: razorpayOrder.id,
          handler: async (response: RazorpayResponse) => {
            try {
              console.log("Payment completed, verifying...", response);

              // Check if we have all required fields for verification
              if (!response.razorpay_order_id || !response.razorpay_signature) {
                console.warn(
                  "Missing order_id or signature in response, proceeding without client-side status update"
                );

                toast({
                  title: "Payment Successful!",
                  description: "Your payment has been processed successfully.",
                });

                onSuccess(response.razorpay_payment_id);
                return;
              }

              // Step 3: Verify payment signature on the server
              const verification = await RazorpayService.verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId, // Our internal order ID
              });

              console.log("Payment verification result:", verification);

              if (verification.success) {
                toast({
                  title: "Payment Successful!",
                  description: "Your payment has been processed successfully.",
                });

                onSuccess(response.razorpay_payment_id);
              } else {
                throw new Error(
                  verification.message || "Payment verification failed"
                );
              }
            } catch (error) {
              console.error("Payment verification error:", error);

              // If verification fails but we have payment_id, rely on webhook to mark status
              if (response.razorpay_payment_id) {
                console.log(
                  "Verification failed; relying on webhook for final status"
                );
              }

              toast({
                title: "Payment Verification Failed",
                description:
                  error instanceof Error
                    ? error.message
                    : "Failed to verify payment",
                variant: "destructive",
              });
              onError(
                error instanceof Error
                  ? error.message
                  : "Payment verification failed"
              );
            }
          },
          prefill: {
            name: userInfo.name,
            email: userInfo.email,
            contact: userInfo.phone,
          },
          theme: {
            color: RAZORPAY_CONFIG.theme.color,
          },
        };

        console.log("Opening Razorpay payment UI...");
        const razorpayInstance = new Razorpay(
          options
        ) as RazorpayInstanceWithEvents;

        // Add event listeners with proper typing
        razorpayInstance.on(
          "payment.failed",
          (response: any) => {
            console.error("Razorpay payment failed:", response);
            onError(response?.error?.description || "Payment failed");
          }
        );

        razorpayInstance.on("modal.close", () => {
          console.log("Razorpay modal closed");
          onClose();
        });

        razorpayInstance.open();
      } catch (error) {
        console.error("Payment error:", error);
        toast({
          title: "Payment Failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process payment",
          variant: "destructive",
        });
        onError(error instanceof Error ? error.message : "Payment failed");
      } finally {
        setIsLoading(false);
      }
    };

    // Check if Razorpay is properly configured
    const isRazorpayConfigured = validateRazorpayConfig();

    // Check amount limits for test mode
    const amountInPaise = Math.round(amount * 100);
    const maxTestAmount = TEST_MODE_CONFIG.maxAmount * 100; // Convert to paise
    const isAmountTooHigh =
      TEST_MODE_CONFIG.enabled && amountInPaise > maxTestAmount;

    if (!isRazorpayConfigured) {
      return (
        <div className="p-4 shadow-sm">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Payment Configuration Required
            </h3>
            <p className="text-xs text-yellow-700 mb-3">
              Razorpay payment gateway is not configured. Please set up your
              environment variables.
            </p>
            <div className="text-xs text-yellow-600">
              <p>Required variables:</p>
              <ul className="list-disc list-inside mt-1">
                <li>VITE_RAZORPAY_KEY_ID</li>
                <li>VITE_RAZORPAY_KEY_SECRET</li>
              </ul>
              <p className="mt-2">
                See RAZORPAY_SETUP.md for detailed instructions.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isAmountTooHigh) {
      return (
        <div className="p-4 shadow-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Amount Too High for Test Mode
            </h3>
            <p className="text-xs text-red-700 mb-3">
              The amount ₹{amount.toFixed(2)} exceeds the test mode limit of ₹
              {TEST_MODE_CONFIG.maxAmount}.
            </p>
            <div className="text-xs text-red-600">
              <p className="mb-2">To test payments with higher amounts:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Switch to Razorpay live mode</li>
                <li>
                  Use a smaller test amount (₹{TEST_MODE_CONFIG.maxAmount} or
                  less)
                </li>
                <li>Contact Razorpay support to increase test limits</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // If showButton is false, don't render anything (component is used programmatically)
    if (!showButton) {
      return null;
    }

    return (
      <div className=" p-4 shadow-sm">
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-red-900 hover:bg-red-500 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Order...
            </div>
          ) : (
            `Pay ₹${amount.toFixed(2)}`
          )}
        </button>
      </div>
    );
  }
);

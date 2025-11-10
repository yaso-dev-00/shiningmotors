import { supabase } from "@/integrations/supabase/client";
import { RazorpayOrderResponse, RazorpayResponse } from "@/lib/razorpay";

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  order_id: string; // Our internal order ID
}

export class RazorpayService {
  // Create Razorpay order
  static async createOrder(
    data: CreateOrderRequest
  ): Promise<RazorpayOrderResponse> {
    try {
      console.log("Calling Supabase function with data:", data);

      const { data: response, error } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: data,
        }
      );

      console.log("Supabase function response:", { response, error });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to create Razorpay order");
      }

      if (!response || (!response.id && !response.razorpayOrderId)) {
        console.error("Invalid response from Supabase function:", response);
        throw new Error("Invalid response from Razorpay order creation");
      }

      // Handle both old and new response formats
      if (response.id) {
        // New format - return as is
        console.log("Using new response format:", response);
        return response;
      } else {
        // Old format - transform to expected format
        const transformedResponse = {
          id: response.razorpayOrderId,
          entity: "order",
          amount: response.amount,
          amount_paid: 0,
          amount_due: response.amount,
          currency: response.currency,
          receipt: `order_${data.receipt}`,
          status: "created",
          created_at: Math.floor(Date.now() / 1000),
        };

        console.log("Transformed response:", transformedResponse);
        return transformedResponse;
      }
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  }

  // Verify payment
  static async verifyPayment(
    data: VerifyPaymentRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: response, error } = await supabase.functions.invoke(
        "verify-razorpay-payment",
        {
          body: data,
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to verify payment");
      }

      return response;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  // Update order status after successful payment
  static async updateOrderStatus(
    orderId: string,
    paymentId: string,
    status: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }
}

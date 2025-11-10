// Razorpay configuration and types
interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    address?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id", // Replace with your actual key
  currency: "INR",
  name: "Shining Motors",
  description: "Payment for your order",
  theme: {
    color: "#ef4444", // Your brand color
  },
};

// Test mode configuration
export const TEST_MODE_CONFIG = {
  enabled: true, // Set to false for production
  maxAmount: 10000, // Maximum amount in INR for test mode
  warningMessage: "This is a test payment. No real money will be charged.",
};

// Validate Razorpay configuration
export const validateRazorpayConfig = () => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId || keyId === "rzp_test_your_key_id") {
    console.error("❌ Razorpay Key ID not configured!");
    console.log("Please add VITE_RAZORPAY_KEY_ID to your .env file");
    return false;
  }
  return true;
};

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize Razorpay
export const initializeRazorpay = async (): Promise<any> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Razorpay can only be initialized in the browser');
  }
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    throw new Error("Failed to load Razorpay script");
  }

  return window.Razorpay;
};

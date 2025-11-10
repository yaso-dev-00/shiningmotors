
import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface StripePaymentFormProps {
  clientSecret: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  amount: number;
}

const PaymentForm = ({ clientSecret, onPaymentSuccess, onPaymentError, amount }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Total',
          amount: Math.round(amount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });

      pr.on('paymentmethod', async (event) => {
        try {
          setIsLoading(true);
          const { error } = await stripe.confirmPayment({
            elements: elements || undefined,
            clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/shop/payment-success`,
            },
          });

          if (error) {
            event.complete('fail');
            onPaymentError(error.message || 'Payment failed');
          } else {
            event.complete('success');
            onPaymentSuccess();
          }
        } catch (error) {
          event.complete('fail');
          onPaymentError('Payment failed');
        } finally {
          setIsLoading(false);
        }
      });
    }
  }, [stripe, elements, amount, onPaymentSuccess, onPaymentError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/shop/payment-success`,
        },
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed');
      } else {
        onPaymentSuccess();
      }
    } catch (error) {
      onPaymentError('Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Request Button (Apple Pay, Google Pay) */}
      {canMakePayment && paymentRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Express Checkout</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentRequestButtonElement 
              options={{ paymentRequest }}
              className="PaymentRequestButton"
            />
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      {canMakePayment && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
          </div>
        </div>
      )}

      {/* Card Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Card Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <Button 
              type="submit" 
              disabled={!stripe || isLoading}
              className="w-full bg-sm-red hover:bg-sm-red-light"
            >
              {isLoading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const StripePaymentForm = ({ clientSecret, onPaymentSuccess, onPaymentError, amount }: StripePaymentFormProps) => {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentForm 
        clientSecret={clientSecret}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        amount={amount}
      />
    </Elements>
  );
};

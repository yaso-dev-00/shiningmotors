import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PurchaseTrackerProps {
  orderId?: string;
  products?: { id: string; name: string }[];
}

export const PurchaseTracker: React.FC<PurchaseTrackerProps> = ({ 
  orderId, 
  products 
}) => {
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      trackPurchase();
    }
  }, [orderId]);

  const trackPurchase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !orderId) return;

      // Get order details to find products
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return;
      }

      // Track each product purchase (this will trigger notifications automatically)
      if (orderData?.order_items) {
        for (const item of orderData.order_items) {
          if (item.product_id) {
            // Use upsert to prevent duplicate key errors
            const { error } = await supabase
              .from('user_purchases')
              .upsert({
                user_id: user.id,
                product_id: item.product_id,
                order_id: orderId,
              }, {
                onConflict: 'user_id,product_id,order_id'
              });

            if (error) {
              console.error('Error tracking purchase:', error);
            }
          }
        }
      }

      toast({
        title: "Order confirmed!",
        description: "You'll receive notifications about your order status.",
      });
    } catch (error) {
      console.error('Error in purchase tracker:', error);
    }
  };

  return null; // This component doesn't render anything
};
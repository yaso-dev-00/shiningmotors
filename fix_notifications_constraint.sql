-- Quick fix for notifications type check constraint
-- Run this directly in Supabase SQL Editor if migration hasn't been applied

-- Drop the existing check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'notifications_type_check'
    AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
  END IF;
END $$;

-- Add new check constraint with all valid notification types
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Social notifications
  'post_like',
  'post_comment',
  'new_post',
  'new_follower',
  
  -- Order notifications
  'order_created',
  'order_status',
  'payment_success',
  'payment_failed',
  'vendor_new_order',
  
  -- Product notifications
  'product_restock',
  'price_drop',
  'new_product',
  
  -- Event notifications
  'event_registration_confirmed',
  'event_registration_pending',
  'event_registration_rejected',
  'event_created',
  'event_updated',
  'event_cancelled',
  'event_reminder',
  
  -- Service notifications
  'service_booking_confirmed',
  'service_booking_pending',
  'service_booking_rejected',
  'service_booking_cancelled',
  'service_booking_completed',
  'service_booking_updated',
  'service_booking_reminder',
  'vendor_new_booking',
  
  -- Security & Account notifications
  'profile_updated',
  'password_changed',
  'new_device_login',
  'suspicious_activity',
  
  -- Promotional & System notifications
  'abandoned_cart',
  'special_offer',
  'maintenance_notice',
  'feature_update',
  
  -- General fallback
  'general'
));




-- Database triggers for order notifications
-- This migration creates notifications for order-related events

-- Function to create notification when an order is created
CREATE OR REPLACE FUNCTION notify_on_order_created()
RETURNS TRIGGER AS $$
DECLARE
  order_number TEXT;
BEGIN
  -- Generate order number from order ID (first 8 characters)
  order_number := UPPER(LEFT(NEW.id::TEXT, 8));
  
  -- Create notification for customer
  PERFORM send_notification_to_user(
    NEW.user_id,
    'order_created',
    'Order #' || order_number || ' placed successfully',
    'Your order #' || order_number || ' has been placed successfully. Total: ₹' || NEW.total,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', order_number,
      'total', NEW.total,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order creation
DROP TRIGGER IF EXISTS trigger_notify_on_order_created ON orders;
CREATE TRIGGER trigger_notify_on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_order_created();

-- Function to create notification when order status changes
CREATE OR REPLACE FUNCTION notify_on_order_status_updated()
RETURNS TRIGGER AS $$
DECLARE
  order_number TEXT;
  status_message TEXT;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Generate order number
  order_number := UPPER(LEFT(NEW.id::TEXT, 8));
  
  -- Determine status message
  CASE NEW.status
    WHEN 'confirmed' THEN
      status_message := 'Your order #' || order_number || ' has been confirmed';
    WHEN 'processing' THEN
      status_message := 'Your order #' || order_number || ' is being processed';
    WHEN 'shipped' THEN
      status_message := 'Your order #' || order_number || ' has been shipped';
    WHEN 'delivered' THEN
      status_message := 'Your order #' || order_number || ' has been delivered';
    WHEN 'cancelled' THEN
      status_message := 'Your order #' || order_number || ' has been cancelled';
    ELSE
      status_message := 'Your order #' || order_number || ' status has been updated to ' || NEW.status;
  END CASE;
  
  -- Create notification for customer
  PERFORM send_notification_to_user(
    NEW.user_id,
    'order_status',
    'Order #' || order_number || ' status updated',
    status_message,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', order_number,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'total', NEW.total
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status updates
DROP TRIGGER IF EXISTS trigger_notify_on_order_status_updated ON orders;
CREATE TRIGGER trigger_notify_on_order_status_updated
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_order_status_updated();

-- Function to notify vendor when they receive a new order
CREATE OR REPLACE FUNCTION notify_vendor_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  vendor_id UUID;
  product_name TEXT;
  order_number TEXT;
BEGIN
  -- Get vendor ID from first order item's product
  SELECT p.seller_id, p.name
  INTO vendor_id, product_name
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.id
  LIMIT 1;
  
  -- Skip if no vendor found
  IF vendor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Generate order number
  order_number := UPPER(LEFT(NEW.id::TEXT, 8));
  
  -- Create notification for vendor
  PERFORM send_notification_to_user(
    vendor_id,
    'vendor_new_order',
    'New order #' || order_number || ' received',
    'You have received a new order #' || order_number || ' for ' || COALESCE(product_name, 'products'),
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', order_number,
      'customer_id', NEW.user_id,
      'total', NEW.total,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vendor notifications on new orders
DROP TRIGGER IF EXISTS trigger_notify_vendor_on_new_order ON orders;
CREATE TRIGGER trigger_notify_vendor_on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_new_order();





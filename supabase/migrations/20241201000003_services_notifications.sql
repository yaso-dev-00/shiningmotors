-- Database triggers for service booking notifications
-- This migration creates notifications for service booking events

-- Function to create notification when a service booking is created
CREATE OR REPLACE FUNCTION notify_on_service_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  service_title TEXT;
  customer_username TEXT;
BEGIN
  -- Get service title
  SELECT s.title INTO service_title
  FROM services s
  WHERE s.id = NEW.service_id;
  
  -- Get customer username
  SELECT username INTO customer_username
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification for customer
  PERFORM send_notification_to_user(
    NEW.user_id,
    'service_booking_pending',
    'Service booking request submitted',
    'Your booking request for ' || COALESCE(service_title, 'service') || ' has been received',
    jsonb_build_object(
      'booking_id', NEW.id,
      'service_id', NEW.service_id,
      'service_title', service_title,
      'booking_date', NEW.booking_date,
      'booking_slot', NEW.booking_slot,
      'status', NEW.status
    )
  );
  
  -- Create notification for vendor
  IF NEW.vendor_id IS NOT NULL THEN
    PERFORM send_notification_to_user(
      NEW.vendor_id,
      'vendor_new_booking',
      'New service booking request',
      COALESCE(customer_username, 'A customer') || ' requested a booking for ' || COALESCE(service_title, 'your service'),
      jsonb_build_object(
        'booking_id', NEW.id,
        'service_id', NEW.service_id,
        'service_title', service_title,
        'customer_id', NEW.user_id,
        'customer_username', customer_username,
        'booking_date', NEW.booking_date,
        'booking_slot', NEW.booking_slot,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for service booking creation
DROP TRIGGER IF EXISTS trigger_notify_on_service_booking_created ON service_bookings;
CREATE TRIGGER trigger_notify_on_service_booking_created
  AFTER INSERT ON service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_service_booking_created();

-- Function to create notification when service booking status changes
CREATE OR REPLACE FUNCTION notify_on_service_booking_status_updated()
RETURNS TRIGGER AS $$
DECLARE
  service_title TEXT;
  status_message TEXT;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get service title
  SELECT s.title INTO service_title
  FROM services s
  WHERE s.id = NEW.service_id;
  
  -- Determine status message
  CASE NEW.status
    WHEN 'confirmed' THEN
      status_message := 'Your booking for ' || COALESCE(service_title, 'service') || ' has been confirmed';
    WHEN 'rejected' THEN
      status_message := 'Your booking for ' || COALESCE(service_title, 'service') || ' was not available';
    WHEN 'cancelled' THEN
      status_message := 'Your booking for ' || COALESCE(service_title, 'service') || ' has been cancelled';
    WHEN 'completed' THEN
      status_message := 'Your service booking for ' || COALESCE(service_title, 'service') || ' has been completed';
    ELSE
      status_message := 'Your booking for ' || COALESCE(service_title, 'service') || ' status has been updated';
  END CASE;
  
  -- Create notification for customer
  PERFORM send_notification_to_user(
    NEW.user_id,
    CASE NEW.status
      WHEN 'confirmed' THEN 'service_booking_confirmed'
      WHEN 'rejected' THEN 'service_booking_rejected'
      WHEN 'cancelled' THEN 'service_booking_cancelled'
      WHEN 'completed' THEN 'service_booking_completed'
      ELSE 'service_booking_updated'
    END,
    'Service booking ' || NEW.status,
    status_message,
    jsonb_build_object(
      'booking_id', NEW.id,
      'service_id', NEW.service_id,
      'service_title', service_title,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'booking_date', NEW.booking_date,
      'booking_slot', NEW.booking_slot
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for service booking status updates
DROP TRIGGER IF EXISTS trigger_notify_on_service_booking_status_updated ON service_bookings;
CREATE TRIGGER trigger_notify_on_service_booking_status_updated
  AFTER UPDATE OF status ON service_bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_service_booking_status_updated();





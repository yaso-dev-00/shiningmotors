-- Database triggers for event notifications
-- This migration creates notifications for event-related events

-- Function to create notification when an event is created
CREATE OR REPLACE FUNCTION notify_on_event_created()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
BEGIN
  event_title := NEW.title;
  
  -- Only notify if event is published
  IF NEW.status = 'published' THEN
    -- Note: This could be extended to notify users who follow the organizer
    -- or users interested in the event category
    -- For now, we'll just create a placeholder that can be extended
    -- The actual notification logic can be implemented based on business requirements
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event creation (placeholder for future implementation)
-- DROP TRIGGER IF EXISTS trigger_notify_on_event_created ON events;
-- CREATE TRIGGER trigger_notify_on_event_created
--   AFTER INSERT ON events
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_on_event_created();

-- Function to create notification when user registers for an event
CREATE OR REPLACE FUNCTION notify_on_event_registration_created()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_organizer_id UUID;
BEGIN
  -- Get event details
  SELECT e.title, e.organizer_id
  INTO event_title, event_organizer_id
  FROM events e
  WHERE e.id = NEW.event_id;
  
  -- Create notification for user
  PERFORM send_notification_to_user(
    NEW.user_id,
    CASE NEW.status
      WHEN 'confirmed' THEN 'event_registration_confirmed'
      WHEN 'pending' THEN 'event_registration_pending'
      ELSE 'event_registration_created'
    END,
    CASE NEW.status
      WHEN 'confirmed' THEN 'Registered for ' || COALESCE(event_title, 'event')
      WHEN 'pending' THEN 'Registration pending for ' || COALESCE(event_title, 'event')
      ELSE 'Registration submitted for ' || COALESCE(event_title, 'event')
    END,
    CASE NEW.status
      WHEN 'confirmed' THEN 'You are registered for ' || COALESCE(event_title, 'this event')
      WHEN 'pending' THEN 'Your registration for ' || COALESCE(event_title, 'this event') || ' is pending approval'
      ELSE 'Your registration for ' || COALESCE(event_title, 'this event') || ' has been submitted'
    END,
    jsonb_build_object(
      'registration_id', NEW.id,
      'event_id', NEW.event_id,
      'event_title', event_title,
      'status', NEW.status,
      'payment_status', NEW.payment_status
    )
  );
  
  -- Notify organizer if event requires approval and registration is pending
  IF NEW.status = 'pending' AND event_organizer_id IS NOT NULL THEN
    PERFORM send_notification_to_user(
      event_organizer_id,
      'event_new_registration',
      'New event registration',
      'A new registration for ' || COALESCE(event_title, 'your event') || ' is pending approval',
      jsonb_build_object(
        'registration_id', NEW.id,
        'event_id', NEW.event_id,
        'event_title', event_title,
        'user_id', NEW.user_id,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event registration creation
DROP TRIGGER IF EXISTS trigger_notify_on_event_registration_created ON event_registrations;
CREATE TRIGGER trigger_notify_on_event_registration_created
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_event_registration_created();

-- Function to create notification when event registration status changes
CREATE OR REPLACE FUNCTION notify_on_event_registration_status_updated()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  status_message TEXT;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get event title
  SELECT e.title INTO event_title
  FROM events e
  WHERE e.id = NEW.event_id;
  
  -- Determine status message
  CASE NEW.status
    WHEN 'confirmed' THEN
      status_message := 'Your registration for ' || COALESCE(event_title, 'this event') || ' has been confirmed';
    WHEN 'rejected' THEN
      status_message := 'Your registration for ' || COALESCE(event_title, 'this event') || ' was not approved';
    WHEN 'cancelled' THEN
      status_message := 'Your registration for ' || COALESCE(event_title, 'this event') || ' has been cancelled';
    ELSE
      status_message := 'Your registration for ' || COALESCE(event_title, 'this event') || ' status has been updated';
  END CASE;
  
  -- Create notification for user
  PERFORM send_notification_to_user(
    NEW.user_id,
    CASE NEW.status
      WHEN 'confirmed' THEN 'event_registration_confirmed'
      WHEN 'rejected' THEN 'event_registration_rejected'
      WHEN 'cancelled' THEN 'event_registration_cancelled'
      ELSE 'event_registration_updated'
    END,
    'Event registration ' || NEW.status,
    status_message,
    jsonb_build_object(
      'registration_id', NEW.id,
      'event_id', NEW.event_id,
      'event_title', event_title,
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event registration status updates
DROP TRIGGER IF EXISTS trigger_notify_on_event_registration_status_updated ON event_registrations;
CREATE TRIGGER trigger_notify_on_event_registration_status_updated
  AFTER UPDATE OF status ON event_registrations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_event_registration_status_updated();

-- Function to create notification when event is updated
CREATE OR REPLACE FUNCTION notify_on_event_updated()
RETURNS TRIGGER AS $$
DECLARE
  registration_record RECORD;
BEGIN
  -- Only notify if important fields changed
  IF (OLD.title IS DISTINCT FROM NEW.title) OR
     (OLD.start_date IS DISTINCT FROM NEW.start_date) OR
     (OLD.venue IS DISTINCT FROM NEW.venue) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Notify all registered users
    FOR registration_record IN
      SELECT user_id
      FROM event_registrations
      WHERE event_id = NEW.id
    LOOP
      PERFORM send_notification_to_user(
        registration_record.user_id,
        CASE NEW.status
          WHEN 'cancelled' THEN 'event_cancelled'
          ELSE 'event_updated'
        END,
        CASE NEW.status
          WHEN 'cancelled' THEN NEW.title || ' has been cancelled'
          ELSE NEW.title || ' has been updated'
        END,
        CASE NEW.status
          WHEN 'cancelled' THEN 'The event ' || NEW.title || ' has been cancelled'
          ELSE 'The event ' || NEW.title || ' has been updated. Please check the new details.'
        END,
        jsonb_build_object(
          'event_id', NEW.id,
          'event_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event updates
DROP TRIGGER IF EXISTS trigger_notify_on_event_updated ON events;
CREATE TRIGGER trigger_notify_on_event_updated
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_event_updated();





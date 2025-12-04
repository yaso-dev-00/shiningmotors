-- Database functions for scheduled reminder notifications
-- These functions can be called by scheduled jobs or API endpoints

-- Function to send event reminders (24 hours before event)
CREATE OR REPLACE FUNCTION send_event_reminders()
RETURNS TABLE(notifications_sent INTEGER) AS $$
DECLARE
  event_record RECORD;
  registration_record RECORD;
  notifications_count INTEGER := 0;
  reminder_time TIMESTAMP;
BEGIN
  -- Find events starting in the next 24-25 hours (to account for timing)
  FOR event_record IN
    SELECT 
      e.id,
      e.title,
      e.start_date,
      e.start_time,
      e.venue,
      e.city
    FROM events e
    WHERE e.status = 'published'
      AND e.start_date IS NOT NULL
      AND e.start_date >= CURRENT_DATE
      AND e.start_date <= CURRENT_DATE + INTERVAL '1 day'
      AND (e.start_date > CURRENT_DATE OR 
           (e.start_date = CURRENT_DATE AND 
            (e.start_time IS NULL OR 
             (CURRENT_TIME + INTERVAL '24 hours')::TIME >= COALESCE(e.start_time, '00:00:00'::TIME))))
  LOOP
    -- Calculate reminder time
    reminder_time := (event_record.start_date::TIMESTAMP + COALESCE(event_record.start_time::TIME, '00:00:00'::TIME));
    
    -- Only send if event is within 24-25 hours
    IF reminder_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours' THEN
      -- Notify all registered users
      FOR registration_record IN
        SELECT user_id
        FROM event_registrations
        WHERE event_id = event_record.id
          AND status IN ('confirmed', 'pending')
      LOOP
        PERFORM send_notification_to_user(
          registration_record.user_id,
          'event_reminder',
          'Reminder: ' || event_record.title || ' starts tomorrow',
          COALESCE(event_record.title, 'Event') || ' starts ' || 
          CASE 
            WHEN event_record.start_time IS NOT NULL 
            THEN 'tomorrow at ' || event_record.start_time
            ELSE 'tomorrow'
          END ||
          CASE 
            WHEN event_record.venue IS NOT NULL 
            THEN ' at ' || event_record.venue
            WHEN event_record.city IS NOT NULL 
            THEN ' in ' || event_record.city
            ELSE ''
          END,
          jsonb_build_object(
            'event_id', event_record.id,
            'event_title', event_record.title,
            'start_date', event_record.start_date,
            'start_time', event_record.start_time,
            'venue', event_record.venue,
            'city', event_record.city
          )
        );
        notifications_count := notifications_count + 1;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT notifications_count;
END;
$$ LANGUAGE plpgsql;

-- Function to send service booking reminders (24 hours before booking)
CREATE OR REPLACE FUNCTION send_service_booking_reminders()
RETURNS TABLE(notifications_sent INTEGER) AS $$
DECLARE
  booking_record RECORD;
  service_title TEXT;
  notifications_count INTEGER := 0;
  booking_datetime TIMESTAMP;
BEGIN
  -- Find bookings scheduled for tomorrow (24 hours from now)
  FOR booking_record IN
    SELECT 
      sb.id,
      sb.user_id,
      sb.service_id,
      sb.booking_date,
      sb.booking_slot,
      sb.status
    FROM service_bookings sb
    WHERE sb.status IN ('confirmed', 'pending')
      AND sb.booking_date IS NOT NULL
      AND sb.booking_date >= CURRENT_DATE
      AND sb.booking_date <= CURRENT_DATE + INTERVAL '1 day'
  LOOP
    -- Parse booking date and time
    IF booking_record.booking_slot IS NOT NULL THEN
      booking_datetime := (booking_record.booking_date::TIMESTAMP + booking_record.booking_slot::TIME);
    ELSE
      booking_datetime := booking_record.booking_date::TIMESTAMP;
    END IF;
    
    -- Only send if booking is within 24-25 hours
    IF booking_datetime BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours' THEN
      -- Get service title
      SELECT s.title INTO service_title
      FROM services s
      WHERE s.id = booking_record.service_id;
      
      -- Send reminder to customer
      PERFORM send_notification_to_user(
        booking_record.user_id,
        'service_booking_reminder',
        'Reminder: ' || COALESCE(service_title, 'Service') || ' appointment tomorrow',
        'Reminder: Your ' || COALESCE(service_title, 'service') || ' appointment is scheduled for ' ||
        CASE 
          WHEN booking_record.booking_slot IS NOT NULL 
          THEN booking_record.booking_date || ' at ' || booking_record.booking_slot
          ELSE booking_record.booking_date
        END,
        jsonb_build_object(
          'booking_id', booking_record.id,
          'service_id', booking_record.service_id,
          'service_title', service_title,
          'booking_date', booking_record.booking_date,
          'booking_slot', booking_record.booking_slot
        )
      );
      notifications_count := notifications_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT notifications_count;
END;
$$ LANGUAGE plpgsql;

-- Function to send abandoned cart reminders (24 hours after last cart update)
CREATE OR REPLACE FUNCTION send_abandoned_cart_reminders()
RETURNS TABLE(notifications_sent INTEGER) AS $$
DECLARE
  cart_record RECORD;
  item_count INTEGER;
  notifications_count INTEGER := 0;
BEGIN
  -- Find carts that were last updated 24 hours ago and have items
  FOR cart_record IN
    SELECT DISTINCT
      ci.user_id,
      COUNT(*) as item_count
    FROM cart_items ci
    WHERE ci.updated_at IS NOT NULL
      AND ci.updated_at <= NOW() - INTERVAL '24 hours'
      AND ci.updated_at >= NOW() - INTERVAL '25 hours'
    GROUP BY ci.user_id
    HAVING COUNT(*) > 0
  LOOP
    -- Send abandoned cart reminder
    PERFORM send_notification_to_user(
      cart_record.user_id,
      'abandoned_cart',
      'You have items waiting in your cart',
      'You have ' || cart_record.item_count || ' item(s) in your cart. Complete your purchase now!',
      jsonb_build_object(
        'user_id', cart_record.user_id,
        'item_count', cart_record.item_count
      )
    );
    notifications_count := notifications_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT notifications_count;
END;
$$ LANGUAGE plpgsql;





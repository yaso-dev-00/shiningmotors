-- Function to insert notifications when social events occur
CREATE OR REPLACE FUNCTION public.send_notification_to_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    read,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE(p_type, 'general'),
    COALESCE(p_title, 'Notification'),
    COALESCE(p_message, ''),
    COALESCE(p_data, '{}'::jsonb),
    FALSE,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_notification_id;

  RETURN new_notification_id;
END;
$$;

COMMENT ON FUNCTION public.send_notification_to_user(uuid, text, text, text, jsonb)
IS 'Creates a notification row used by social triggers and returns the new notification id';






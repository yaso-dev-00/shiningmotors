-- Database triggers for extended social notifications
-- This migration creates notifications for follow/unfollow events

-- Function to create notification when someone follows a user
CREATE OR REPLACE FUNCTION notify_on_user_followed()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
BEGIN
  -- Skip if user follows themselves
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  -- Get follower username
  SELECT username INTO follower_username
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification for the user being followed
  PERFORM send_notification_to_user(
    NEW.following_id,
    'new_follower',
    COALESCE(follower_username, 'Someone') || ' started following you',
    COALESCE(follower_username, 'Someone') || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_username', follower_username,
      'following_id', NEW.following_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new followers
DROP TRIGGER IF EXISTS trigger_notify_on_user_followed ON user_follows;
CREATE TRIGGER trigger_notify_on_user_followed
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_user_followed();





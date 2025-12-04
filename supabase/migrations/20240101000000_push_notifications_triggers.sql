-- Database triggers for automatic notification creation
-- This file should be run in Supabase SQL Editor or via migration

-- Function to create notification when a like is created
CREATE OR REPLACE FUNCTION notify_on_like_created()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_username TEXT;
  post_content_preview TEXT;
BEGIN
  -- Get post owner and liker info
  SELECT p.user_id, pr.username, LEFT(p.content, 50)
  INTO post_owner_id, liker_username, post_content_preview
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  -- Skip if user likes their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for post owner
  PERFORM send_notification_to_user(
    post_owner_id,
    'post_like',
    COALESCE(liker_username, 'Someone') || ' liked your post',
    COALESCE(liker_username, 'Someone') || ' liked your post: ' || COALESCE(post_content_preview, ''),
    jsonb_build_object(
      'post_id', NEW.post_id,
      'liker_id', NEW.user_id,
      'like_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes
DROP TRIGGER IF EXISTS trigger_notify_on_like_created ON likes;
CREATE TRIGGER trigger_notify_on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like_created();

-- Function to create notification when a comment is created
CREATE OR REPLACE FUNCTION notify_on_comment_created()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
  comment_preview TEXT;
BEGIN
  -- Get post owner and commenter info
  SELECT p.user_id, pr.username, LEFT(NEW.content, 100)
  INTO post_owner_id, commenter_username, comment_preview
  FROM posts p
  LEFT JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  -- Skip if user comments on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for post owner
  PERFORM send_notification_to_user(
    post_owner_id,
    'post_comment',
    COALESCE(commenter_username, 'Someone') || ' commented on your post',
    COALESCE(comment_preview, 'New comment'),
    jsonb_build_object(
      'post_id', NEW.post_id,
      'comment_id', NEW.id,
      'commenter_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
DROP TRIGGER IF EXISTS trigger_notify_on_comment_created ON comments;
CREATE TRIGGER trigger_notify_on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment_created();

-- Function to create notifications for followers when a post is created
CREATE OR REPLACE FUNCTION notify_followers_on_post_created()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  post_author_username TEXT;
  post_preview TEXT;
BEGIN
  -- Get post author username
  SELECT username INTO post_author_username
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get post preview
  post_preview := LEFT(COALESCE(NEW.content, ''), 100);

  -- Notify all followers
  FOR follower_record IN
    SELECT follower_id
    FROM user_follows
    WHERE following_id = NEW.user_id
  LOOP
    PERFORM send_notification_to_user(
      follower_record.follower_id,
      'new_post',
      COALESCE(post_author_username, 'Someone you follow') || ' posted something new',
      COALESCE(post_preview, 'New post'),
      jsonb_build_object(
        'post_id', NEW.id,
        'author_id', NEW.user_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new posts
DROP TRIGGER IF EXISTS trigger_notify_followers_on_post_created ON posts;
CREATE TRIGGER trigger_notify_followers_on_post_created
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_post_created();

-- Function to send push notification when notification is created
-- This will be called via webhook or API
CREATE OR REPLACE FUNCTION trigger_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by a webhook or API endpoint
  -- The actual push notification sending will be handled by the Next.js API
  -- We just need to ensure the notification is created
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add notification_preferences column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN notification_preferences JSONB DEFAULT '{
      "push_likes": true,
      "push_comments": true,
      "push_new_posts": true,
      "email_notifications": true,
      "sms_notifications": true
    }'::jsonb;
  END IF;
END $$;


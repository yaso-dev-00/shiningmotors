-- Fix push_subscriptions table to allow multiple devices per user
-- Remove unique constraint on user_id and add proper indexing

-- Drop the unique constraint on user_id if it exists
DO $$ 
BEGIN
  -- Check if the unique constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'push_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE push_subscriptions 
    DROP CONSTRAINT push_subscriptions_user_id_key;
  END IF;
END $$;

-- Add an index on user_id for faster queries (not unique)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON push_subscriptions(user_id);

-- Add a GIN index on the subscription JSONB column for faster JSON queries
-- This index helps with all JSONB operations including searching for specific keys/values
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_subscription_gin 
ON push_subscriptions USING GIN (subscription);

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE push_subscriptions 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Add a comment explaining the table structure
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions. Each user can have multiple subscriptions (one per device). The subscription JSON contains the FCM token and other device-specific information.';


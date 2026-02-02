-- AI response cache table for pre-computed responses and caching
-- This migration creates tables for AI optimization

-- AI response cache table
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  cache_hits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  embedding vector(1536) -- For semantic search (optional, requires pgvector extension)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_query_hash ON ai_response_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_expires_at ON ai_response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_created_at ON ai_response_cache(created_at);

-- User AI usage tracking
CREATE TABLE IF NOT EXISTS user_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10, 4) DEFAULT 0,
  period_start TIMESTAMP DEFAULT NOW(),
  period_end TIMESTAMP,
  UNIQUE(user_id, period_start)
);

-- Index for user AI usage
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_id ON user_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_period ON user_ai_usage(period_start, period_end);

-- Pre-computed responses table
CREATE TABLE IF NOT EXISTS ai_precomputed_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_pattern TEXT NOT NULL,
  response_text TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for pre-computed responses
CREATE INDEX IF NOT EXISTS idx_precomputed_pattern ON ai_precomputed_responses(query_pattern);
CREATE INDEX IF NOT EXISTS idx_precomputed_priority ON ai_precomputed_responses(priority DESC, is_active);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_response_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert some pre-computed responses for common queries
INSERT INTO ai_precomputed_responses (query_pattern, response_text, priority) VALUES
  ('return policy|refund policy|how to return', 
   'Our return policy allows returns within 30 days of purchase. Items must be unused and in original packaging. For more details, visit your order history or contact support.', 
   10),
  ('contact support|customer service|help desk', 
   'You can contact our support team via email at support@shiningmotors.com or through the messaging system. We typically respond within 24 hours.', 
   10),
  ('shipping|delivery time|how long to ship', 
   'Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available at checkout. You''ll receive tracking information once your order ships.', 
   9),
  ('track order|order status|where is my order', 
   'You can track your order in the ''Orders'' section of your profile. Click on any order to see detailed status and tracking information.', 
   9),
  ('payment methods|how to pay|accepted payments', 
   'We accept all major credit cards, debit cards, UPI, and digital wallets. Payment is processed securely at checkout.', 
   8)
ON CONFLICT DO NOTHING;

-- RLS policies (if needed)
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_precomputed_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY "Users can view own AI usage" ON user_ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Pre-computed responses are public (read-only)
CREATE POLICY "Pre-computed responses are public" ON ai_precomputed_responses
  FOR SELECT USING (is_active = true);

-- Policy: Cache entries are public (read-only for users)
CREATE POLICY "Cache entries are public" ON ai_response_cache
  FOR SELECT USING (expires_at > NOW());



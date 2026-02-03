# AI Database Migrations - Step by Step Instructions

## Quick Start

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migration 1: AI Response Cache**
   - Open file: `supabase/migrations/20250101000000_ai_response_cache.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for "Success" message

4. **Run Migration 2: AI Context Tracking**
   - Open file: `supabase/migrations/20250101000001_ai_context_tracking.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run"
   - Wait for "Success" message

5. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see:
     - ✅ `ai_response_cache`
     - ✅ `user_ai_usage`
     - ✅ `ai_precomputed_responses`
     - ✅ `user_interactions`
     - ✅ `ai_conversations`

---

### Option 2: Supabase CLI (If Installed)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## Migration Details

### Migration 1: `20250101000000_ai_response_cache.sql`

**Creates:**
1. **`ai_response_cache`** - Server-side cache for AI responses
   - Stores query hash, response text, model used, tokens
   - TTL-based expiration
   - Optional embedding column for semantic search

2. **`user_ai_usage`** - Tracks user AI usage
   - Request count, token count, cost estimate
   - Per user, per time period

3. **`ai_precomputed_responses`** - Pre-written responses
   - Common FAQs with patterns
   - Priority-based matching
   - 5 pre-populated responses

**Indexes:**
- Query hash (fast lookups)
- Expiration date (cleanup)
- User ID (usage tracking)

**Functions:**
- `clean_expired_ai_cache()` - Removes expired entries

**RLS Policies:**
- Users can view their own usage
- Cache entries are public (read-only)
- Pre-computed responses are public

---

### Migration 2: `20250101000001_ai_context_tracking.sql`

**Creates:**
1. **`user_interactions`** - Tracks user behavior
   - Interaction type (view, click, add_to_cart, etc.)
   - Item type (product, service, event, etc.)
   - Metadata (JSONB for flexible data)

2. **`ai_conversations`** - Stores conversation history
   - Messages array (JSONB)
   - Context (page, cart state, etc.)
   - Auto-update timestamp

**Indexes:**
- User ID (fast queries)
- Interaction type (analytics)
- Created date (time-based queries)

**Triggers:**
- Auto-update `updated_at` on conversation updates

**RLS Policies:**
- Users can only see their own interactions
- Users can only see their own conversations
- Users can insert/update their own data

---

## Important: pgvector Extension

The `ai_response_cache` table includes an `embedding` column that requires the `pgvector` extension for semantic search.

### If You Want Semantic Search (Recommended):

```sql
-- Run this BEFORE Migration 1
CREATE EXTENSION IF NOT EXISTS vector;
```

### If You Don't Need Semantic Search Yet:

You can modify the migration to remove the embedding column:

```sql
-- After running Migration 1, you can drop the column:
ALTER TABLE ai_response_cache DROP COLUMN IF EXISTS embedding;

-- Or modify the migration file before running to remove this line:
-- embedding vector(1536) -- For semantic search (optional, requires pgvector extension)
```

**Note:** The embedding column is optional. The cache will work without it, but you won't have semantic similarity matching.

---

## Verification Queries

After running migrations, verify with these queries:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ai_response_cache',
  'user_ai_usage', 
  'ai_precomputed_responses',
  'user_interactions',
  'ai_conversations'
);

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
  'ai_response_cache',
  'user_ai_usage',
  'ai_precomputed_responses',
  'user_interactions',
  'ai_conversations'
);

-- Check pre-computed responses
SELECT * FROM ai_precomputed_responses;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'ai_response_cache',
  'user_ai_usage',
  'ai_precomputed_responses',
  'user_interactions',
  'ai_conversations'
);
```

---

## Troubleshooting

### Error: "relation already exists"
- Tables might already exist from previous runs
- Migrations use `CREATE TABLE IF NOT EXISTS` so this is safe
- You can ignore this error or drop tables first

### Error: "extension vector does not exist"
- Install pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
- Or remove embedding column from migration

### Error: "permission denied"
- Ensure you're using the correct database user
- Check you have CREATE TABLE permissions
- Use Supabase Dashboard (has all permissions)

### Error: "syntax error"
- Check SQL syntax
- Ensure all quotes are properly closed
- Copy entire file, don't modify

---

## Post-Migration Steps

1. **Verify Tables:**
   - Go to Table Editor
   - Check all 5 tables exist

2. **Test RLS Policies:**
   - Try querying as different users
   - Verify users can only see their own data

3. **Check Pre-computed Responses:**
   ```sql
   SELECT * FROM ai_precomputed_responses;
   ```
   - Should show 5 rows

4. **Test Cache Function:**
   ```sql
   SELECT clean_expired_ai_cache();
   ```
   - Should run without errors

---

## Rollback (If Needed)

If you need to remove the migrations:

```sql
-- Drop tables (in reverse order)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS ai_precomputed_responses CASCADE;
DROP TABLE IF EXISTS user_ai_usage CASCADE;
DROP TABLE IF EXISTS ai_response_cache CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS clean_expired_ai_cache() CASCADE;
DROP FUNCTION IF EXISTS update_ai_conversations_updated_at() CASCADE;
```

**Warning:** This will delete all data in these tables!

---

## Next Steps After Migrations

1. ✅ Add `OPENAI_API_KEY` to environment variables
2. ✅ Test AI chat in development
3. ✅ Deploy to production
4. ✅ Monitor usage and costs
5. ✅ Set up cache cleanup cron job (optional)

See `AI_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

---

*Migration files are safe to run multiple times (uses IF NOT EXISTS)*



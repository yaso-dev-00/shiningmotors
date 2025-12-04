# Fix: Multiple Devices Per User for Push Notifications

## Problem

When a user logged in from different devices with the same credentials, they encountered a duplicate key error:

```
Error saving push subscription: {
  code: '23505',
  details: 'Key (user_id)=(...) already exists.',
  message: 'duplicate key value violates unique constraint "push_subscriptions_user_id_key"'
}
```

This happened because the `push_subscriptions` table had a unique constraint on `user_id`, preventing users from having multiple subscriptions (one per device).

## Solution

### 1. Database Migration

Created migration: `supabase/migrations/20241201000008_fix_push_subscriptions_multiple_devices.sql`

**Changes:**
- ✅ Removed unique constraint on `user_id` 
- ✅ Added index on `user_id` for faster queries (not unique)
- ✅ Added GIN index on FCM tokens within subscription JSON
- ✅ Added `updated_at` column with auto-update trigger
- ✅ Added table documentation

**To Apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `20241201000008_fix_push_subscriptions_multiple_devices.sql`

### 2. API Route Updates

**File:** `src/app/api/push/subscribe/route.ts`

**Changes:**
- ✅ Fixed subscription lookup to properly check FCM tokens in JSON
- ✅ Now supports multiple subscriptions per user (one per device)
- ✅ Updates existing subscription if same device, creates new if different device
- ✅ Improved DELETE endpoint to handle specific device unsubscription

**How It Works Now:**
1. User logs in on Device A → Subscription saved with FCM token A
2. User logs in on Device B → New subscription saved with FCM token B
3. User logs in again on Device A → Existing subscription updated (not duplicated)
4. User can receive notifications on both devices

### 3. Send Route

**File:** `src/app/api/push/send/route.ts`

**Already Handles Multiple Devices:**
- ✅ Fetches all subscriptions for a user
- ✅ Extracts FCM tokens from all subscriptions
- ✅ Sends notification to all devices simultaneously

## Database Schema

**Before:**
```sql
-- Only one subscription per user (unique constraint)
push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,  -- ❌ This prevented multiple devices
  subscription JSONB
)
```

**After:**
```sql
-- Multiple subscriptions per user (one per device)
push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,  -- ✅ No unique constraint
  subscription JSONB,  -- Contains FCM token per device
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_fcm_token ON push_subscriptions USING GIN ((subscription->>'token'), (subscription->>'fcmToken'));
```

## Testing

### Test Scenario 1: Multiple Devices
1. Login on Device A (mobile)
2. Enable push notifications → Subscription saved
3. Login on Device B (desktop)
4. Enable push notifications → New subscription saved
5. Both devices should receive notifications ✅

### Test Scenario 2: Same Device Re-login
1. Login on Device A
2. Enable push notifications → Subscription saved
3. Logout and login again on Device A
4. Enable push notifications → Existing subscription updated (not duplicated) ✅

### Test Scenario 3: Unsubscribe Specific Device
1. User has subscriptions on Device A and Device B
2. Unsubscribe on Device A → Only Device A subscription removed
3. Device B should still receive notifications ✅

## Migration Steps

1. **Backup your database** (recommended)
2. **Run the migration:**
   ```sql
   -- Copy contents of: supabase/migrations/20241201000008_fix_push_subscriptions_multiple_devices.sql
   -- Paste and run in Supabase SQL Editor
   ```
3. **Verify the constraint is removed:**
   ```sql
   SELECT conname, contype 
   FROM pg_constraint 
   WHERE conrelid = 'push_subscriptions'::regclass 
   AND conname = 'push_subscriptions_user_id_key';
   -- Should return 0 rows
   ```
4. **Test with multiple devices**

## Benefits

✅ **Multiple Device Support:** Users can receive notifications on all their devices  
✅ **Better UX:** No more duplicate key errors  
✅ **Device-Specific Management:** Can unsubscribe from specific devices  
✅ **Scalable:** Supports unlimited devices per user  
✅ **Performance:** Indexes ensure fast lookups  

## Notes

- Existing subscriptions will continue to work
- The migration is safe to run on production (no data loss)
- Users with existing subscriptions will need to re-enable push notifications on new devices after migration
- The system automatically handles duplicate prevention based on FCM tokens




# Web Push Notifications Setup Guide

This guide explains how to set up web push notifications for the Shining Motors application.

## Prerequisites

1. Node.js and npm installed
2. Supabase project set up
3. Vercel deployment (or similar hosting)

## Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications. Generate them using the `web-push` package:

```bash
npx web-push generate-vapid-keys
```

This will output:
- Public Key: Use this as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Private Key: Use this as `VAPID_PRIVATE_KEY` (keep this secret!)

## Step 2: Set Environment Variables

Add the following environment variables to your `.env.local` file and Vercel project:

```env
# VAPID Keys for Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Step 3: Run Database Migrations

Execute the SQL migration file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/migrations/20240101000000_push_notifications_triggers.sql`

This will:
- Create database triggers for likes, comments, and new posts
- Add `notification_preferences` column to the `profiles` table
- Set up automatic notification creation

## Step 4: Install Dependencies

The `web-push` package should already be added to `package.json`. Install dependencies:

```bash
npm install
```

## Step 5: Configure Supabase Webhook (Optional)

To automatically send push notifications when database notifications are created, you can set up a Supabase webhook:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create a new webhook
3. Set the URL to: `https://your-domain.com/api/push/webhook`
4. Select the `notifications` table
5. Choose `INSERT` event
6. Add authentication header if needed

Alternatively, push notifications are sent directly from the `NotificationProvider` component when new notifications arrive via real-time subscriptions.

## Step 6: Test Push Notifications

1. Start your development server: `npm run dev`
2. Navigate to Settings → Notifications
3. Enable push notifications
4. Grant browser permission when prompted
5. Click "Send Test Notification" to verify it works

## Features

### Notification Types

- **Post Likes**: Notifies when someone likes your post
- **Post Comments**: Notifies when someone comments on your post
- **New Posts**: Notifies when someone you follow posts something new

### User Preferences

Users can control notification preferences in Settings → Notifications:
- Enable/disable push notifications for each type
- Email notifications
- SMS notifications

### Real-time Updates

- New posts from followed users appear in real-time in the feed
- Notifications are sent automatically via database triggers
- Push notifications respect user preferences

## Troubleshooting

### Push notifications not working

1. **Check VAPID keys**: Ensure both public and private keys are set correctly
2. **Browser support**: Push notifications require HTTPS (except localhost)
3. **Service worker**: Ensure `/sw.js` is accessible and registered
4. **Permissions**: User must grant notification permission
5. **Subscriptions**: Check `push_subscriptions` table in Supabase

### Database triggers not firing

1. Check Supabase logs for errors
2. Verify triggers are created: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';`
3. Test triggers manually by inserting test data

### Notifications not respecting preferences

1. Check `notification_preferences` column exists in `profiles` table
2. Verify preferences are saved correctly
3. Check API route logs for preference filtering

## API Endpoints

- `POST /api/push/subscribe` - Save push subscription
- `DELETE /api/push/subscribe` - Remove push subscription
- `POST /api/push/send` - Send push notification to user
- `PUT /api/push/send` - Batch send notifications
- `POST /api/push/webhook` - Webhook endpoint for Supabase

## Security Notes

- Never expose `VAPID_PRIVATE_KEY` in client-side code
- Use `NEXT_PUBLIC_VAPID_PUBLIC_KEY` only on the client
- Validate all webhook requests
- Use Supabase Row Level Security (RLS) for database access






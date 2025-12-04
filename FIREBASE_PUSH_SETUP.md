# Firebase Cloud Messaging (FCM) Push Notifications Setup

This guide explains how to set up Firebase Cloud Messaging for web push notifications in the Shining Motors application.

## Prerequisites

1. Firebase project created at https://console.firebase.google.com
2. Node.js and npm installed
3. Supabase project set up

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing project: `shining-motors-d75ce`
3. Enable Cloud Messaging API:
   - Go to Project Settings → Cloud Messaging
   - Enable "Cloud Messaging API (Legacy)" if not already enabled

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings → General
2. Scroll down to "Your apps" section
3. Click on the Web icon (`</>`) to add a web app
4. Register your app and copy the Firebase configuration

## Step 3: Generate VAPID Key for Web Push

1. In Firebase Console, go to Project Settings → Cloud Messaging
2. Scroll to "Web configuration" section
3. Under "Web Push certificates", click "Generate key pair"
4. Copy the generated key (this is your VAPID key)

## Step 4: Get Service Account Credentials

1. In Firebase Console, go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file (contains `project_id`, `private_key`, `client_email`)

## Step 5: Set Environment Variables

Add the following to your `.env.local` file:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shining-motors-d75ce.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shining-motors-d75ce
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shining-motors-d75ce.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=shining-motors-d75ce
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@shining-motors-d75ce.iam.gserviceaccount.com

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` should include the full key with `\n` characters (or use actual newlines)
- For Vercel, add these same variables in Project Settings → Environment Variables

## Step 6: Update Service Worker

The service worker file `public/firebase-messaging-sw.js` needs to be updated with your Firebase config:

1. Replace `YOUR_API_KEY`, `YOUR_SENDER_ID`, and `YOUR_APP_ID` with actual values
2. Or better: Use environment variables (requires build-time injection)

## Step 7: Install Dependencies

```bash
npm install firebase firebase-admin
```

## Step 8: Run Database Migrations

Execute the SQL migration in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20240101000000_push_notifications_triggers.sql`

## Step 9: Test Push Notifications

1. Start your development server: `npm run dev`
2. Navigate to Settings → Notifications
3. Enable push notifications
4. Grant browser permission when prompted
5. Click "Send Test Notification"

## Troubleshooting

### "Firebase messaging not initialized"
- Check that all `NEXT_PUBLIC_FIREBASE_*` environment variables are set
- Restart your development server after adding environment variables

### "No FCM token available"
- Ensure service worker is registered correctly
- Check browser console for errors
- Verify VAPID key is correct

### "Firebase Admin not initialized"
- Check `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, and `FIREBASE_CLIENT_EMAIL` are set
- Ensure private key format is correct (with `\n` characters)

### Service Worker Not Loading
- Ensure `firebase-messaging-sw.js` is in the `public` folder
- Check browser DevTools → Application → Service Workers
- Clear cache and hard reload

## Firebase vs VAPID

This implementation uses Firebase Cloud Messaging instead of raw VAPID keys because:
- ✅ Easier setup and management
- ✅ Better error handling and token management
- ✅ Built-in analytics and delivery tracking
- ✅ Support for multiple platforms (web, iOS, Android)
- ✅ Automatic token refresh handling

## Files Modified

- `src/lib/firebase-admin.ts` - Firebase Admin SDK initialization
- `src/lib/firebase-client.ts` - Firebase Client SDK initialization
- `src/hooks/usePushNotifications.ts` - Updated to use FCM tokens
- `src/app/api/push/send/route.ts` - Updated to use Firebase Admin SDK
- `src/app/api/push/subscribe/route.ts` - Updated to handle FCM tokens
- `public/firebase-messaging-sw.js` - Firebase service worker






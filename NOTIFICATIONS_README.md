# Notifications System - Complete Documentation

## Overview

The Shining Motors application includes a comprehensive notification system that covers social interactions, e-commerce, events, services, and more. Notifications are delivered via in-app notifications, push notifications (browser), and can be extended to email and SMS.

## Table of Contents

1. [Notification Types](#notification-types)
2. [Implementation Areas](#implementation-areas)
3. [Database Structure](#database-structure)
4. [API Routes](#api-routes)
5. [Frontend Components](#frontend-components)
6. [User Preferences](#user-preferences)
7. [Setup & Configuration](#setup--configuration)
8. [Testing](#testing)

---

## Notification Types

### Social Notifications 👥

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `post_like` | Someone liked your post | User likes a post | Post author |
| `post_comment` | Someone commented on your post | User comments on a post | Post author |
| `new_post` | Followed user created a new post | User creates a post | Followers |
| `new_follower` | Someone started following you | User follows another user | Followed user |

**Location:** `supabase/migrations/20240101000000_push_notifications_triggers.sql`  
**Location:** `supabase/migrations/20241201000005_social_extended_notifications.sql`

---

### E-Commerce / Shop Notifications 🛒

#### Order Notifications

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `order_created` | Order successfully placed | Order inserted | Customer |
| `order_status` | Order status changed | Order status updated | Customer |
| `payment_success` | Payment verified | Payment verified | Customer |
| `payment_failed` | Payment failed | Payment fails | Customer |
| `vendor_new_order` | Vendor received new order | Order created for vendor's product | Vendor |

**Location:** `supabase/migrations/20241201000002_orders_notifications.sql`

#### Product Notifications

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `product_restock` | Out-of-stock product available | Product inventory: 0 → >0 | Users with product in wishlist |
| `price_drop` | Product price decreased | Product price decreased (>5% or >₹100) | Users with product in wishlist |
| `new_product` | Vendor added new product | New product created | Users following the vendor |

**Location:** `supabase/migrations/20241201000006_products_notifications.sql`

**Features:**
- **Restock**: Notifies when inventory goes from 0 to >0
- **Price Drop**: Only notifies if drop is significant (≥5% or ≥₹100)
- **New Product**: Notifies followers when vendor publishes new product

---

### Event Notifications 🎉

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `event_registration_confirmed` | Event registration confirmed | Registration status → confirmed | Registrant |
| `event_registration_pending` | Event registration pending | Registration requires approval | Registrant |
| `event_registration_rejected` | Event registration rejected | Registration status → rejected | Registrant |
| `event_created` | New event published | Event created | All users or category followers |
| `event_updated` | Event details changed | Event updated | Registered users |
| `event_cancelled` | Event cancelled | Event status → cancelled | Registered users |
| `event_reminder` | Event reminder (24h before) | Scheduled job | Registered users |

**Location:** `supabase/migrations/20241201000004_events_notifications.sql`  
**Location:** `supabase/migrations/20241201000007_reminder_notifications.sql`

**Reminder System:**
- Sends reminders 24 hours before event start
- Uses scheduled cron job via `/api/notifications/reminders`

---

### Service Notifications 🔧

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `service_booking_confirmed` | Service booking confirmed | Booking status → confirmed | Customer |
| `service_booking_pending` | Service booking pending | Booking submitted | Customer |
| `service_booking_rejected` | Service booking rejected | Booking status → rejected | Customer |
| `service_booking_reminder` | Service reminder (24h before) | Scheduled job | Customer |
| `vendor_new_booking` | Vendor received booking request | Booking created | Vendor |

**Location:** `supabase/migrations/20241201000003_services_notifications.sql`  
**Location:** `supabase/migrations/20241201000007_reminder_notifications.sql`

---

### Security & Account Notifications 🔐

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `profile_updated` | Profile information updated | Profile updated | User |
| `password_changed` | Password changed | Password changed | User |
| `new_device_login` | Login from new device | Login from unknown device | User |
| `suspicious_activity` | Suspicious activity detected | Unusual activity | User |

**Preference:** Controlled by `push_security` preference

---

### Promotional & System Notifications 📢

| Type | Description | Trigger | Target Users |
|------|-------------|---------|--------------|
| `abandoned_cart` | Items left in cart | 24h after cart last updated | User |
| `special_offer` | Special promotional offer | Manual trigger | Selected users |
| `maintenance_notice` | Scheduled maintenance | Manual trigger | All users |
| `feature_update` | New feature released | Manual trigger | All users |

**Preference:** Controlled by `push_promotional` preference

---

## Implementation Areas

### 1. Products 🛍️

**Database Triggers:**
- **File:** `supabase/migrations/20241201000006_products_notifications.sql`
- **Triggers:**
  - `trigger_notify_on_product_restock` - When inventory goes from 0 to >0
  - `trigger_notify_on_product_price_drop` - When price decreases significantly
  - `trigger_notify_on_new_product` - When vendor publishes new product

**Notification Flow:**
1. Product inventory/price changes in database
2. Trigger fires and calls `send_notification_to_user()`
3. Notification created in `notifications` table
4. Webhook sends push notification (if enabled)
5. User receives notification on all devices

**Target Users:**
- **Restock/Price Drop**: Users with product in wishlist
- **New Product**: Users following the vendor

**Example:**
```sql
-- When product inventory changes from 0 to 10
UPDATE products SET inventory = 10 WHERE id = 'product-123';
-- → Creates 'product_restock' notification for all wishlist users
```

---

### 2. Events 🎉

**Database Triggers:**
- **File:** `supabase/migrations/20241201000004_events_notifications.sql`
- **Triggers:**
  - `trigger_notify_on_event_registration` - Registration status changes
  - `trigger_notify_on_event_created` - New event published
  - `trigger_notify_on_event_updated` - Event details changed
  - `trigger_notify_on_event_cancelled` - Event cancelled

**Reminder System:**
- **File:** `supabase/migrations/20241201000007_reminder_notifications.sql`
- **API:** `src/app/api/notifications/reminders/route.ts`
- **Function:** `send_event_reminders()` - Sends reminders 24h before event

**Notification Flow:**
1. Event registration/update happens
2. Trigger creates notification
3. Webhook sends push notification
4. Reminder cron job checks upcoming events daily

**Target Users:**
- **Registration**: Registrant
- **Created/Updated**: All users or category followers
- **Cancelled**: All registered users
- **Reminder**: Registered users (24h before)

**Example:**
```sql
-- When user registers for event
INSERT INTO event_registrations (user_id, event_id, status) 
VALUES ('user-123', 'event-456', 'confirmed');
-- → Creates 'event_registration_confirmed' notification
```

---

### 3. Orders 🛒

**Database Triggers:**
- **File:** `supabase/migrations/20241201000002_orders_notifications.sql`
- **Triggers:**
  - `trigger_notify_on_order_created` - Order placed
  - `trigger_notify_on_order_status_change` - Order status updated
  - `trigger_notify_vendor_on_new_order` - Vendor receives order

**Notification Flow:**
1. Order created or status updated
2. Trigger creates notification for customer
3. If vendor product, also creates notification for vendor
4. Webhook sends push notifications

**Target Users:**
- **Order Created/Status**: Customer
- **Vendor New Order**: Vendor (when their product is ordered)

**Example:**
```sql
-- When order status changes
UPDATE orders SET status = 'shipped' WHERE id = 'order-123';
-- → Creates 'order_status' notification for customer
```

---

### 4. Services 🔧

**Database Triggers:**
- **File:** `supabase/migrations/20241201000003_services_notifications.sql`
- **Triggers:**
  - `trigger_notify_on_service_booking` - Booking status changes
  - `trigger_notify_vendor_on_new_booking` - Vendor receives booking

**Reminder System:**
- **File:** `supabase/migrations/20241201000007_reminder_notifications.sql`
- **Function:** `send_service_booking_reminders()` - Sends reminders 24h before service

**Target Users:**
- **Booking Status**: Customer
- **Vendor New Booking**: Vendor
- **Reminder**: Customer (24h before service)

---

### 5. Social 👥

**Database Triggers:**
- **File:** `supabase/migrations/20240101000000_push_notifications_triggers.sql`
- **File:** `supabase/migrations/20241201000005_social_extended_notifications.sql`
- **Triggers:**
  - `trigger_notify_on_post_like` - Post liked
  - `trigger_notify_on_post_comment` - Post commented
  - `trigger_notify_followers_on_post_created` - New post created
  - `trigger_notify_on_new_follower` - New follower

**Target Users:**
- **Like/Comment**: Post author
- **New Post**: Followers
- **New Follower**: Followed user

---

## Database Structure

### Tables

#### `notifications`
Stores all notifications for users.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `push_subscriptions`
Stores FCM tokens for push notifications (multiple devices per user).

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription JSONB NOT NULL, -- Contains FCM token and device info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `profiles.notification_preferences`
JSONB column storing user notification preferences.

```json
{
  "push_likes": true,
  "push_comments": true,
  "push_new_posts": true,
  "push_orders": true,
  "push_order_status": true,
  "push_events": true,
  "push_services": true,
  "push_followers": true,
  "push_products": true,
  "push_security": true,
  "push_promotional": false,
  "email_notifications": true,
  "sms_notifications": true
}
```

### Core Function

**`send_notification_to_user()`**
- **File:** `supabase/migrations/20241201000001_create_send_notification_function.sql`
- **Purpose:** Creates notification row in database
- **Used by:** All database triggers

```sql
SELECT send_notification_to_user(
  user_id,
  'product_restock',
  'Product is back in stock!',
  'Product name is now available.',
  '{"product_id": "123"}'::jsonb
);
```

---

## API Routes

### 1. Push Notifications

#### `POST /api/push/subscribe`
Subscribe user to push notifications.

**Request:**
```json
{
  "user_id": "uuid",
  "subscription": {
    "token": "fcm-token",
    "fcmToken": "fcm-token"
  }
}
```

**Location:** `src/app/api/push/subscribe/route.ts`

#### `POST /api/push/send`
Send push notification to user(s).

**Request:**
```json
{
  "user_id": "uuid",
  "notification": {
    "title": "Notification Title",
    "message": "Notification message",
    "type": "product_restock",
    "data": {"product_id": "123"},
    "url": "/shop/product/123"
  }
}
```

**Location:** `src/app/api/push/send/route.ts`

#### `POST /api/push/webhook`
Supabase webhook handler for automatic push notifications.

**Location:** `src/app/api/push/webhook/route.ts`

### 2. Reminders

#### `POST /api/notifications/reminders`
Trigger reminder notifications (events, services, abandoned cart).

**Request:**
```json
{
  "type": "events" | "services" | "abandoned_cart"
}
```

**Location:** `src/app/api/notifications/reminders/route.ts`

**Setup:** Configure cron job to call this endpoint daily.

---

## Frontend Components

### 1. Notification Provider

**File:** `src/components/notifications/NotificationProvider.tsx`

**Features:**
- Fetches notifications from database
- Real-time subscription for new notifications
- Handles push notification sending
- Respects user preferences

**Usage:**
```tsx
import { useNotifications } from '@/components/notifications/NotificationProvider';

const { notifications, unreadCount, markAsRead } = useNotifications();
```

### 2. Notification Settings

**File:** `src/components/settings/NotificationsTab.tsx`

**Features:**
- Toggle push notifications on/off
- Configure notification preferences
- View all notifications
- Navigate to related pages on click

**URL Navigation:**
- Social: `/social/post/{post_id}`
- Products: `/shop/product/{product_id}`
- Orders: `/shop/orders/{order_id}`
- Events: `/events/{event_id}`
- Services: `/myServiceBookings?service={service_id}`

### 3. Push Notifications Hook

**File:** `src/hooks/usePushNotifications.ts`

**Features:**
- Request notification permission
- Subscribe/unsubscribe to push notifications
- Handle foreground messages
- Send test notifications

**Usage:**
```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

const { subscribeUser, unsubscribe, sendTestNotification } = usePushNotifications();
```

### 4. Service Worker

**File:** `public/firebase-messaging-sw.js`

**Features:**
- Handles background push notifications
- Displays notifications when app is closed
- Handles notification clicks
- PWA caching

---

## User Preferences

### Preference Types

Users can control notifications via settings (`/settings`):

1. **Push Notifications** (Master Toggle)
   - Enable/disable all push notifications

2. **Category Preferences:**
   - `push_likes` - Post likes
   - `push_comments` - Post comments
   - `push_new_posts` - New posts from followed users
   - `push_orders` - Order updates
   - `push_order_status` - Order status changes
   - `push_events` - Event notifications
   - `push_services` - Service booking notifications
   - `push_followers` - New followers
   - `push_products` - Product updates (restock, price drop)
   - `push_security` - Security alerts
   - `push_promotional` - Promotional notifications

3. **Channel Preferences:**
   - `email_notifications` - Email notifications
   - `sms_notifications` - SMS notifications

### Preference Checking

Preferences are checked in:
- `src/app/api/push/send/route.ts` - Before sending push notification
- `src/components/notifications/NotificationProvider.tsx` - Before sending push from real-time subscription

---

## Setup & Configuration

### 1. Database Migrations

Run all migrations in order:

```bash
1. 20241201000001_create_send_notification_function.sql
2. 20240101000000_push_notifications_triggers.sql (Social)
3. 20241201000002_orders_notifications.sql
4. 20241201000003_services_notifications.sql
5. 20241201000004_events_notifications.sql
6. 20241201000005_social_extended_notifications.sql
7. 20241201000006_products_notifications.sql
8. 20241201000007_reminder_notifications.sql
9. 20241201000008_fix_push_subscriptions_multiple_devices.sql
```

### 2. Environment Variables

```env
# Firebase (for push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Supabase Webhook Setup

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook
3. URL: `https://your-domain.com/api/push/webhook`
4. Events: `INSERT` on `notifications` table
5. HTTP Method: `POST`

### 4. Cron Job Setup (for Reminders)

Set up a cron job to call `/api/notifications/reminders` daily:

**Example (Vercel Cron):**
```json
{
  "crons": [
    {
      "path": "/api/notifications/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Or use external service like:
- EasyCron
- Cron-job.org
- GitHub Actions

---

## Testing

### Test Push Notifications

1. **Enable Push Notifications:**
   - Go to `/settings`
   - Toggle "Push Notifications" ON
   - Grant browser permission

2. **Send Test Notification:**
   - Click "Send Test Notification" in settings
   - Should receive notification

### Test Product Notifications

1. **Restock:**
   ```sql
   -- Add product to wishlist
   INSERT INTO wishlist (user_id, item_id, item_type) 
   VALUES ('user-id', 'product-id', 'product');
   
   -- Update inventory from 0 to 10
   UPDATE products SET inventory = 10 WHERE id = 'product-id';
   -- → Should create 'product_restock' notification
   ```

2. **Price Drop:**
   ```sql
   -- Update price (drop by 10%)
   UPDATE products SET price = 900 WHERE id = 'product-id' AND price = 1000;
   -- → Should create 'price_drop' notification
   ```

### Test Event Notifications

1. **Registration:**
   ```sql
   -- Register for event
   INSERT INTO event_registrations (user_id, event_id, status) 
   VALUES ('user-id', 'event-id', 'confirmed');
   -- → Should create 'event_registration_confirmed' notification
   ```

2. **Reminder:**
   - Call `/api/notifications/reminders` with `{"type": "events"}`
   - Should send reminders for events starting in 24 hours

### Test Order Notifications

```sql
-- Create order
INSERT INTO orders (user_id, status, ...) VALUES (...);
-- → Should create 'order_created' notification

-- Update order status
UPDATE orders SET status = 'shipped' WHERE id = 'order-id';
-- → Should create 'order_status' notification
```

---

## Notification Flow Diagram

```
┌─────────────────┐
│  Database Event │
│  (Trigger Fires)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ send_notification_to_user()│
│ Creates notification row │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  notifications table     │
│  (INSERT)               │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase Webhook       │
│  /api/push/webhook      │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Check User Preferences  │
│  (push_products, etc.)  │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/push/send         │
│  Firebase Admin SDK     │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  FCM Push Service       │
│  (Google Cloud)         │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│  User's Device(s)       │
│  (Browser/PWA)          │
└─────────────────────────┘
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── push/
│   │   │   ├── subscribe/route.ts      # Subscribe to push
│   │   │   ├── send/route.ts            # Send push notification
│   │   │   └── webhook/route.ts         # Supabase webhook
│   │   └── notifications/
│   │       └── reminders/route.ts       # Reminder notifications
├── components/
│   ├── notifications/
│   │   ├── NotificationProvider.tsx     # Notification context
│   │   └── NotificationsDropdown.tsx    # Header dropdown
│   └── settings/
│       └── NotificationsTab.tsx          # Settings page
├── hooks/
│   └── usePushNotifications.ts           # Push notification hook
└── lib/
    ├── firebase-admin.ts                 # Firebase Admin SDK
    └── firebase-client.ts                # Firebase Client SDK

public/
└── firebase-messaging-sw.js              # Service worker

supabase/migrations/
├── 20241201000001_create_send_notification_function.sql
├── 20240101000000_push_notifications_triggers.sql
├── 20241201000002_orders_notifications.sql
├── 20241201000003_services_notifications.sql
├── 20241201000004_events_notifications.sql
├── 20241201000005_social_extended_notifications.sql
├── 20241201000006_products_notifications.sql
├── 20241201000007_reminder_notifications.sql
└── 20241201000008_fix_push_subscriptions_multiple_devices.sql
```

---

## Best Practices

1. **Always check user preferences** before sending notifications
2. **Use appropriate notification types** for proper filtering
3. **Include relevant data** in notification `data` field for navigation
4. **Test on multiple devices** to ensure push notifications work
5. **Handle errors gracefully** when FCM tokens are invalid
6. **Clean up old subscriptions** when users unsubscribe
7. **Respect user's notification preferences** at all times

---

## Troubleshooting

### Notifications Not Appearing

1. Check browser notification permission
2. Verify FCM token is saved in database
3. Check user preferences are enabled
4. Verify service worker is registered
5. Check browser console for errors

### Push Notifications Not Working

1. Verify Firebase configuration
2. Check `SUPABASE_SERVICE_ROLE_KEY` is set
3. Verify webhook is configured correctly
4. Check FCM tokens are valid
5. Test with `/api/push/send` directly

### Database Triggers Not Firing

1. Verify migrations are run
2. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%';`
3. Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'send_notification_to_user';`
4. Check database logs for errors

---

## Support

For issues or questions:
1. Check this README
2. Review migration files
3. Check API route logs
4. Verify environment variables
5. Test with browser DevTools

---

**Last Updated:** December 2024  
**Version:** 2.0




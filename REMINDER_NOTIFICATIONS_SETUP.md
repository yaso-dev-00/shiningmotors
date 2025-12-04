# Reminder Notifications Setup Guide

## Overview

Phase 2 implementation includes scheduled reminder notifications that need to be triggered periodically via cron jobs or scheduled tasks.

## Reminder Types

1. **Event Reminders** - Sent 24 hours before an event starts
2. **Service Booking Reminders** - Sent 24 hours before a service booking
3. **Abandoned Cart Reminders** - Sent 24 hours after cart was last updated

## Database Functions

The following PostgreSQL functions are available:

- `send_event_reminders()` - Sends event reminders
- `send_service_booking_reminders()` - Sends service booking reminders
- `send_abandoned_cart_reminders()` - Sends abandoned cart reminders

## API Endpoint

**Endpoint:** `POST /api/notifications/reminders`

**Request Body:**
```json
{
  "type": "event_reminders" | "service_booking_reminders" | "abandoned_cart" | "all",
  "secret": "your-cron-secret"
}
```

**Response:**
```json
{
  "success": true,
  "type": "event_reminders",
  "notifications_sent": 5,
  "result": [...],
  "timestamp": "2024-12-01T12:00:00.000Z"
}
```

## Setting Up Cron Jobs

### Option 1: Vercel Cron Jobs (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

Or use Vercel Dashboard → Project Settings → Cron Jobs

### Option 2: External Cron Service

Use services like:
- **cron-job.org**
- **EasyCron**
- **Cronitor**
- **GitHub Actions** (with scheduled workflows)

**Example cron-job.org setup:**
- URL: `https://your-domain.com/api/notifications/reminders`
- Method: POST
- Body: `{"type": "all", "secret": "your-secret"}`
- Schedule: Every hour (`0 * * * *`)

### Option 3: Supabase Edge Functions + pg_cron

If using Supabase, you can set up pg_cron extension:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule event reminders (runs every hour)
SELECT cron.schedule(
  'send-event-reminders',
  '0 * * * *', -- Every hour
  $$
  SELECT send_event_reminders();
  $$
);

-- Schedule service booking reminders (runs every hour)
SELECT cron.schedule(
  'send-service-reminders',
  '0 * * * *', -- Every hour
  $$
  SELECT send_service_booking_reminders();
  $$
);

-- Schedule abandoned cart reminders (runs every hour)
SELECT cron.schedule(
  'send-cart-reminders',
  '0 * * * *', -- Every hour
  $$
  SELECT send_abandoned_cart_reminders();
  $$
);
```

## Environment Variables

Add to `.env.local` and Vercel:

```env
CRON_SECRET=your-secure-random-secret-key-here
```

**Important:** Use a strong, random secret key to prevent unauthorized access to the reminder endpoint.

## Testing

### Manual Testing

1. **Test Event Reminders:**
```bash
curl -X POST https://your-domain.com/api/notifications/reminders \
  -H "Content-Type: application/json" \
  -d '{"type": "event_reminders", "secret": "your-secret"}'
```

2. **Test Service Booking Reminders:**
```bash
curl -X POST https://your-domain.com/api/notifications/reminders \
  -H "Content-Type: application/json" \
  -d '{"type": "service_booking_reminders", "secret": "your-secret"}'
```

3. **Test All Reminders:**
```bash
curl -X POST https://your-domain.com/api/notifications/reminders \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "secret": "your-secret"}'
```

### Health Check

```bash
curl https://your-domain.com/api/notifications/reminders
```

## How It Works

1. **Event Reminders:**
   - Function checks for events starting in the next 24-25 hours
   - Sends notifications to all registered users (confirmed or pending status)
   - Includes event details (title, date, time, venue)

2. **Service Booking Reminders:**
   - Function checks for service bookings scheduled for tomorrow
   - Sends notifications to customers with confirmed or pending bookings
   - Includes booking details (service name, date, time)

3. **Abandoned Cart Reminders:**
   - Function checks for carts last updated 24 hours ago
   - Sends notifications to users with items still in cart
   - Encourages users to complete their purchase

## Notification Preferences

Users can control reminder notifications through their notification preferences:
- Event reminders: Controlled by `push_events` preference
- Service booking reminders: Controlled by `push_services` preference
- Abandoned cart reminders: Controlled by `push_promotional` preference

## Troubleshooting

1. **No notifications being sent:**
   - Check if cron job is running
   - Verify `CRON_SECRET` matches in request
   - Check database functions are created
   - Verify users have notification preferences enabled

2. **Notifications sent but not received:**
   - Check user has push notifications enabled
   - Verify user has active FCM token
   - Check notification preferences allow the type

3. **Too many/few notifications:**
   - Adjust the time window in database functions
   - Modify the cron schedule frequency

## Next Steps

After setting up cron jobs:
1. Monitor the first few runs to ensure notifications are sent correctly
2. Adjust timing if needed (e.g., send reminders 48 hours before instead of 24)
3. Add logging/monitoring to track notification delivery rates
4. Consider adding email/SMS fallbacks for important reminders





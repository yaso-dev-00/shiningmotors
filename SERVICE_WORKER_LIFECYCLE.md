# Service Worker Lifecycle - When It Works, Registers, and Disables

## Overview

This document explains when the service worker is active, when it gets registered, and when it's disabled in the Shining Motors application.

## Service Worker Registration

### When It Gets Registered

The service worker is registered automatically when the app loads:

1. **Location:** `src/components/PwaRegister.tsx`
2. **When:** On every page load (component mounts in root layout)
3. **Trigger:** Automatically runs in `src/app/layout.tsx`

**Registration Flow:**
```javascript
// Runs on every page load
useEffect(() => {
  // 1. Check if browser supports service workers
  if (!('serviceWorker' in navigator)) {
    return; // Service workers not supported
  }

  // 2. Register the service worker
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/' }
  );
}, []);
```

**Registration Conditions:**
- ✅ Browser supports service workers (`'serviceWorker' in navigator`)
- ✅ User visits any page (service worker registered globally)
- ✅ HTTPS connection (required for service workers, except localhost)

### Registration States

1. **Installing** - Service worker file is being downloaded and parsed
2. **Installed** - Service worker is installed but not yet active
3. **Activating** - Service worker is becoming active
4. **Activated** - Service worker is active and controlling pages

## When Service Worker Is Working

The service worker is **active and working** when:

### 1. **After Successful Registration**
- Service worker file (`/firebase-messaging-sw.js`) is loaded
- Installation completes successfully
- Activation completes successfully

### 2. **During Active State**
The service worker handles:

**A. Push Notifications (Background)**
- Receives push messages when app is closed or in background
- Displays notifications using `messaging.onBackgroundMessage()`
- Handles notification clicks and navigation

**B. Caching (PWA Features)**
- Caches app assets for offline access
- Serves cached content when offline
- Updates cache when new version is available

**C. Fetch Interception**
- Intercepts network requests
- Serves cached responses when offline
- Falls back to offline.html for navigation requests

### 3. **Service Worker States**

**Active State Indicators:**
```javascript
// Check if service worker is active
const registration = await navigator.serviceWorker.ready;
if (registration.active) {
  // Service worker is active and working
}
```

**Working Conditions:**
- ✅ Service worker is registered
- ✅ Service worker is activated
- ✅ Browser supports service workers
- ✅ User has granted notification permission (for push notifications)
- ✅ User has subscribed to push notifications (for FCM)

## When Service Worker Is Disabled

The service worker can be disabled or not working in these scenarios:

### 1. **Browser Doesn't Support Service Workers**
```javascript
if (!('serviceWorker' in navigator)) {
  // Service workers not supported
  // Common in:
  // - Very old browsers
  // - Some mobile browsers
  // - Private/Incognito mode (some browsers)
}
```

**Browsers that don't support:**
- Internet Explorer (all versions)
- Very old versions of Safari (< 11.1)
- Some mobile browsers

### 2. **Not HTTPS (Production)**
- Service workers require HTTPS in production
- Exception: `localhost` and `127.0.0.1` work over HTTP
- If not HTTPS, registration will fail silently

### 3. **Registration Failed**
```javascript
try {
  await navigator.serviceWorker.register('/firebase-messaging-sw.js');
} catch (error) {
  // Registration failed
  // Service worker is disabled
  console.error('Service worker registration failed', error);
}
```

**Common failure reasons:**
- Service worker file not found (404 error)
- Service worker file has syntax errors
- Network error during download
- Browser security restrictions

### 4. **User Unregistered Service Worker**
Users can manually unregister service workers:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers"
4. Click "Unregister"

**Firefox:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers"
4. Click "Unregister"

### 5. **Service Worker Uninstalled**
The service worker can be uninstalled programmatically:
```javascript
// Unregister all service workers
const registrations = await navigator.serviceWorker.getRegistrations();
for (let registration of registrations) {
  await registration.unregister();
}
```

### 6. **Browser Cleared Data**
- User clears browser cache and site data
- User clears browsing data
- Service worker is removed along with cache

### 7. **Push Notifications Disabled**
Even if service worker is active, push notifications won't work if:
- User denied notification permission
- User revoked notification permission
- Browser doesn't support Push API
- FCM token is invalid or expired

## Service Worker Lifecycle Events

### Install Event
```javascript
// In firebase-messaging-sw.js
self.addEventListener('install', (event) => {
  // 1. Cache app assets
  // 2. Skip waiting to activate immediately
  self.skipWaiting();
});
```

**When:** Service worker file is first downloaded or updated

### Activate Event
```javascript
// In firebase-messaging-sw.js
self.addEventListener('activate', (event) => {
  // 1. Clean up old caches
  // 2. Claim all clients immediately
  self.clients.claim();
});
```

**When:** Service worker becomes active and takes control

### Fetch Event
```javascript
// In firebase-messaging-sw.js
self.addEventListener('fetch', (event) => {
  // Intercept network requests
  // Serve from cache if offline
});
```

**When:** Any network request is made (only when service worker is active)

### Message Event
```javascript
// In firebase-messaging-sw.js
messaging.onBackgroundMessage((payload) => {
  // Handle push notifications in background
});
```

**When:** Push notification is received (only when service worker is active)

## Checking Service Worker Status

### In Code
```javascript
// Check if service worker is supported
const isSupported = 'serviceWorker' in navigator;

// Check if service worker is registered
const registration = await navigator.serviceWorker.ready;
if (registration) {
  console.log('Service worker is active');
}

// Check service worker state
if (registration.active) {
  console.log('Service worker is active');
} else if (registration.installing) {
  console.log('Service worker is installing');
} else if (registration.waiting) {
  console.log('Service worker is waiting');
}
```

### In Browser DevTools

**Chrome/Edge:**
1. Open DevTools (F12)
2. Application tab → Service Workers
3. See registration status, state, and scope

**Firefox:**
1. Open DevTools (F12)
2. Application tab → Service Workers
3. See registration status and state

## Service Worker Update Cycle

### Automatic Updates
- Browser checks for service worker updates on every page load
- If new version is found, it's downloaded in the background
- Old service worker continues working until new one activates

### Update Process
1. **New service worker installed** (in background)
2. **Old service worker continues** serving pages
3. **New service worker waits** (in "waiting" state)
4. **All pages close** → New service worker activates
5. **Or:** `skipWaiting()` → New service worker activates immediately

### Current Implementation
```javascript
// In firebase-messaging-sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
});
```

**Result:** New service worker activates immediately, closing old pages

## Troubleshooting

### Service Worker Not Registering

1. **Check browser support:**
   ```javascript
   console.log('Service Worker supported:', 'serviceWorker' in navigator);
   ```

2. **Check HTTPS:**
   - Production must use HTTPS
   - Localhost works with HTTP

3. **Check file exists:**
   - Verify `/firebase-messaging-sw.js` is accessible
   - Check network tab for 404 errors

4. **Check console errors:**
   - Look for JavaScript errors in service worker file
   - Check for syntax errors

### Service Worker Registered But Not Working

1. **Check activation:**
   ```javascript
   const registration = await navigator.serviceWorker.ready;
   console.log('Active:', registration.active);
   ```

2. **Check notification permission:**
   ```javascript
   console.log('Permission:', Notification.permission);
   ```

3. **Check FCM token:**
   - Verify FCM token is generated
   - Check if token is saved to database

4. **Check service worker state:**
   - Open DevTools → Application → Service Workers
   - Verify state is "activated and is running"

### Service Worker Disabled Unexpectedly

1. **Check browser settings:**
   - Some browsers disable service workers in private mode
   - Check if extensions are blocking service workers

2. **Check cache:**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)

3. **Check registration:**
   ```javascript
   const registrations = await navigator.serviceWorker.getRegistrations();
   console.log('Registrations:', registrations.length);
   ```

## Summary

| State | When | Condition |
|-------|------|-----------|
| **Registered** | On every page load | Browser supports service workers |
| **Working** | After activation | Service worker is active and controlling pages |
| **Disabled** | Multiple scenarios | Browser doesn't support, not HTTPS, registration failed, user unregistered, or data cleared |

## Key Points

1. **Registration:** Automatic on every page load (if supported)
2. **Working:** After successful installation and activation
3. **Disabled:** When browser doesn't support, registration fails, or user unregisters
4. **Updates:** Automatically checked on every page load
5. **Persistence:** Survives page refreshes and browser restarts (until unregistered)





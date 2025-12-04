import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';

let messaging: Messaging | null = null;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "shining-motors-d75ce.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shining-motors-d75ce",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "shining-motors-d75ce.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} else if (typeof window !== 'undefined') {
  app = getApps()[0];
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
}

export { messaging, app };
export default messaging;






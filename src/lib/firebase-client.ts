import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';

let messaging: Messaging | null = null;
let app: FirebaseApp | undefined;

// Firebase configuration - trim all values to remove whitespace/newlines
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "shining-motors-d75ce.firebaseapp.com").trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shining-motors-d75ce").trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "shining-motors-d75ce.appspot.com").trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'projectId', 'messagingSenderId', 'appId'];
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    const value = firebaseConfig[field as keyof typeof firebaseConfig];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      missingFields.push(field);
    } else if (typeof value === 'string' && (value.includes('\n') || value.includes('\r'))) {
      // Log warning if value contains newlines (should be trimmed, but log for debugging)
      console.warn(`Firebase config field '${field}' contains newline characters. This may cause issues.`);
    }
  });
  
  if (missingFields.length > 0) {
    const envVarNames = {
      apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
      projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    };
    
    const missingEnvVars = missingFields.map(f => envVarNames[f as keyof typeof envVarNames]).join(', ');
    console.error(
      `Firebase configuration is incomplete. Missing required fields: ${missingFields.join(', ')}. ` +
      `Please set the following environment variables: ${missingEnvVars}`
    );
    return false;
  }
  
  return true;
};

// Initialize Firebase
if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      // Validate config before initializing
      if (!validateFirebaseConfig()) {
        console.error('Firebase initialization skipped due to missing configuration');
      } else {
        app = initializeApp(firebaseConfig);
        if ('serviceWorker' in navigator) {
          try {
            messaging = getMessaging(app);
          } catch (messagingError: any) {
            console.error('Failed to initialize Firebase Messaging:', messagingError);
            messaging = null;
          }
        }
      }
    } else {
      app = getApps()[0];
      if ('serviceWorker' in navigator) {
        try {
          messaging = getMessaging(app);
        } catch (messagingError: any) {
          console.error('Failed to get Firebase Messaging:', messagingError);
          messaging = null;
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to initialize Firebase:', error);
    if (error.message?.includes('INVALID_ARGUMENT') || error.message?.includes('invalid argument')) {
      console.error(
        'Firebase configuration error. Please verify all environment variables are set correctly: ' +
        'NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID, ' +
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID'
      );
    }
    messaging = null;
  }
}

export { messaging, app };
export default messaging;






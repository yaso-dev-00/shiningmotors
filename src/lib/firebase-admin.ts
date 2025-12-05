import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let messaging: Messaging | null = null;

// Initialize Firebase Admin SDK
const firebaseConfig = {
  projectId: (process.env.FIREBASE_PROJECT_ID || "shining-motors-d75ce").trim(),
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim()
    : null,
  clientEmail: (process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@shining-motors-d75ce.iam.gserviceaccount.com").trim()
};

// Validate Firebase Admin configuration
const validateFirebaseAdminConfig = () => {
  const missingFields: string[] = [];
  
  if (!firebaseConfig.projectId || firebaseConfig.projectId.length === 0) {
    missingFields.push('FIREBASE_PROJECT_ID');
  }
  
  if (!firebaseConfig.privateKey || firebaseConfig.privateKey.length === 0) {
    missingFields.push('FIREBASE_PRIVATE_KEY');
  } else if (!firebaseConfig.privateKey.includes('BEGIN PRIVATE KEY')) {
    console.error('FIREBASE_PRIVATE_KEY does not appear to be a valid private key. It should start with "-----BEGIN PRIVATE KEY-----"');
    return false;
  }
  
  if (!firebaseConfig.clientEmail || firebaseConfig.clientEmail.length === 0) {
    missingFields.push('FIREBASE_CLIENT_EMAIL');
  } else if (!firebaseConfig.clientEmail.includes('@') || !firebaseConfig.clientEmail.includes('.iam.gserviceaccount.com')) {
    console.error('FIREBASE_CLIENT_EMAIL does not appear to be a valid service account email. It should be in the format: firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com');
    return false;
  }
  
  if (missingFields.length > 0) {
    console.error(
      `Firebase Admin configuration is incomplete. Missing required fields: ${missingFields.join(', ')}. ` +
      `Please set these environment variables in Vercel. ` +
      `To get new credentials, go to: https://console.firebase.google.com/project/${firebaseConfig.projectId}/settings/serviceaccounts/adminsdk`
    );
    return false;
  }
  
  return true;
};

if (!getApps().length) {
  try {
    // Validate config before initializing
    if (!validateFirebaseAdminConfig()) {
      console.error('Firebase Admin initialization skipped due to missing or invalid configuration');
      messaging = null;
    } else {
      initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          privateKey: firebaseConfig.privateKey!,
          clientEmail: firebaseConfig.clientEmail,
        })
      });
      messaging = getMessaging();
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error: any) {
    console.error('Error initializing Firebase Admin:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('invalid_grant') || error.message?.includes('account not found')) {
      console.error(
        '\n❌ Firebase Admin credentials are invalid or revoked.\n' +
        'To fix this:\n' +
        '1. Go to: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/settings/serviceaccounts/adminsdk\n' +
        '2. Click "Generate new private key"\n' +
        '3. Download the JSON file\n' +
        '4. Extract the following values:\n' +
        '   - FIREBASE_PROJECT_ID: from "project_id" field\n' +
        '   - FIREBASE_PRIVATE_KEY: from "private_key" field (keep the \\n characters)\n' +
        '   - FIREBASE_CLIENT_EMAIL: from "client_email" field\n' +
        '5. Update these in your Vercel environment variables\n' +
        '6. Redeploy your application\n'
      );
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      console.error(
        '\n❌ Firebase Admin configuration error.\n' +
        'Please verify all environment variables are set correctly:\n' +
        '- FIREBASE_PROJECT_ID\n' +
        '- FIREBASE_PRIVATE_KEY (must include \\n for newlines)\n' +
        '- FIREBASE_CLIENT_EMAIL\n'
      );
    }
    
    messaging = null;
  }
} else {
  try {
    messaging = getMessaging();
  } catch (error) {
    console.error('Error getting Firebase Admin Messaging:', error);
    messaging = null;
  }
}

export { messaging };
export default messaging;






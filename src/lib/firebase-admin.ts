import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let messaging: Messaging | null = null;

// Initialize Firebase Admin SDK
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "shining-motors-d75ce",
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCtUCdrtgTvmMCT\nRUpn86NWuB+5XcCAKIw2lB4AB2G3DIwKoVJCkNXgxd/oj0hjtAtINU7NZOY/jJ6B\nUvM3HrZMsMNCrgN2TNweLR1u0jn+XdF01fz8sdBeopylEiXO6ys+sdlZzbQeUgRT\n/W6fb8rlwAiZNHG+5HDvceK1cdPLEufGlY6RqA/OotJVgnMq6XD+xEf+lRLRekwj\nITCAFFCiwOa3F+Cxijo+CyFM5E57ZoeRd7KhRwK4FCCX1QcYwaDKaw6cFnRP9504\nqE8oHIqg0ty96ahhaafyMJm+YZ2g+djYWT55CyaTA4KxBniMKYhPeKqP6XgZ7/Zy\nnLdpqu4PAgMBAAECggEAMmgunvg4pUsDL5ImmudUqWMx7uLimyOv7CvWMeHzvJ6M\nmIbk+vFPE2nZvrT1s/Homh7PBZQEF5WZgDmU/YIUOWfr0pfz79NY7fnnJpVEQsQc\nqGOYihJZbTzUXHpTvsPNNxXZBnJ6oZrvIVKDeyGznHDmz1BeiMu+QRYZfvZVSCmC\nlWaiFsXkN0hpfNzQmLXwA80H/C0I4/l4x9Hqpk0IsUx4Vkrd6vpuokr+8IY95y8H\ntvIdve0aQ6SUj66r5HryNlYBadatsxNmdy56PBx/GsBWIhwYnQwZ2Bcpypmvcr0v\n9eYnfeHfMr5sSUg2WDn/NIWk7mHxh9suRW30VAh/aQKBgQD0hJQmF/t2Z7JZb41f\nU34ddvRcmBRJT0KYHSJi4RFLJbTzbuyDl3ogCrCD5iY3suSIZClzlvLZR5fR+REB\nrgxoSyGeN6UaInyvCEAd9HIa4/Xqotbul7IjNjsB8mM4d411+9AxkGOV1bRzOZWc\nvaQR1ZJa9snbKegoecIjruLHIwKBgQC1c5oGxqGxmgVRz8eHPkbaQYr4SnyVHavo\nYqFHpfkcGd+KU0Ki0mtolccypfHAKe8bqdzsX+kQYaIqRgbe7DwDk7Y636dPHTpV\n59DIqfBd1NuJfTULZ1Cg3mG8ya1hn7YVbt+NK5L9GjoAOhHlZ1fYx+t5wZ5KkhZq\nUpEkWaCiJQKBgQDsgtzF6AacZfsWFReasCjZmTkN4zAkJN1WQ0ACgo72sBdSK+Xr\n9vXyzkQkoNYwpAH3h2Ks4sItttk8CX0QsehgbOOspUg2eks+Bm32S36fUgaJGU9q\nYyK0en0jCfA9Ky6Sg6rCdlZNFPPBTF7RyIFNmtZA1Fs1eViM5hEJ8Nx8HwKBgCHC\n6qvMFZXYFJlOUc/GNKSzgUoFgfy00qGgiGWuahVicwdnyoRFJpsFE1VHLx4UL1s0\nVdjdV54mrGe1M94SknAP8d4ucxDzXUFSqrRLel/bFSYV1+LRTF1CQ2k/FTWO4/BE\n+u9nZigV0yjrpRzMB7pcKGI1NmCloeoShtL+ojbJAoGBALmoDYlFKG82D79ww9wr\nzKHFMl4jp97o5dflN78QvL0MNS3BRrwTqedNlwGQbeyJ20E4bq2iTtiyvq4aSwOg\nvHFdkLdkirxlF+wrTThm3300Yw2EWJUwhC6wZQJqdz9mGVTscvMAVlJGGMdmTifQ\nx4prd19mpLjlRlDsEjcudK94\n-----END PRIVATE KEY-----\n").replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@shining-motors-d75ce.iam.gserviceaccount.com"
};

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: firebaseConfig.projectId,
        privateKey: firebaseConfig.privateKey,
        clientEmail: firebaseConfig.clientEmail,
      })
    });
    messaging = getMessaging();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
} else {
  messaging = getMessaging();
}

export { messaging };
export default messaging;






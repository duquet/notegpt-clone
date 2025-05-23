import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only on the client side
let app = null;
let auth: Auth | null = null;

if (typeof window !== "undefined" && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Connect to Firebase Emulator in development if available
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
  ) {
    connectAuthEmulator(auth, "http://localhost:9099");
  }
}

export { auth };

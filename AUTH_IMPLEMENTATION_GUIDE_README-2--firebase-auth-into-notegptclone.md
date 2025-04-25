This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, Install the dependencies run the development server:

```bash

npm install
npm run dev
# or
yarn install
yarn dev
# or
pnpm install
pnpm dev
# or
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Run Flask Server

> If the `env` folder is already present in `api/` directory, do delete it first

To run the flask server, first activate the virtual environment and install dependencies

```
python3 -m venv env
cd api && source env/bin/activate
```

Once, the envireonment is activate, install the dependencies

```
pip install -r requirements.txt
```

After that, run:

```
python api.py
```

The flask server will run on http://localhost:5000

## Step-by-Step Implementation Guide

### Prerequisites

1. Ensure you have Node.js and npm installed
2. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
3. Enable Authentication in Firebase Console:
   - Go to Authentication > Sign-in methods
   - Enable Email/Password and Google Sign-in

### Step 1: Firebase Configuration

1. Create `.env.local` in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

2. Create `src/utils/firebase.ts`:

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Connect to Firebase Emulator in development
if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(auth, "http://localhost:9099");
}

export { auth };
```

### Step 2: Authentication Context

1. Create `src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onIdTokenChanged,
} from "firebase/auth";
import { auth } from "@/utils/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Use onIdTokenChanged for better session sync
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Store the token in localStorage or cookies if needed
        const token = await user.getIdToken();
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // ... implement other auth methods ...

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### Step 3: Root Layout Integration

1. Update `app/layout.tsx`:

```typescript
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Step 4: Protected Route Implementation

1. Create `src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token && request.nextUrl.pathname.startsWith("/workspace")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/workspace/:path*",
};
```

### Step 5: Authentication Components

[Previous auth components implementation remains the same...]

## Technical Details

### Session Management

1. **Token Storage:**

   - ID tokens stored in localStorage
   - Refresh handled by `onIdTokenChanged`
   - Session persistence configurable:
     ```typescript
     import { setPersistence, browserLocalPersistence } from "firebase/auth";
     await setPersistence(auth, browserLocalPersistence);
     ```

2. **Role-Based Access:**
   ```typescript
   // Using Firebase Custom Claims
   const getCustomClaims = async () => {
     const token = await user?.getIdTokenResult();
     return token?.claims;
   };
   ```

### Error Handling

```typescript
const handleAuthError = (error: FirebaseError) => {
  switch (error.code) {
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Invalid password";
    // ... other cases
    default:
      return "An unexpected error occurred";
  }
};
```

### Authentication Flow Diagram

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Sign In    │     │  AuthContext  │     │   Firebase   │
│    Page      │────▶│   Provider    │────▶│     Auth     │
└──────────────┘     └───────────────┘     └──────────────┘
                            │
                            │
                     ┌──────▼──────┐
                     │  Protected   │
                     │   Routes     │
                     └─────────────┘
```

### Development Setup

1. **Firebase Emulator:**

   ```bash
   npm install -g firebase-tools
   firebase init emulators
   firebase emulators:start
   ```

2. **Test Users:**
   ```typescript
   // Development only
   const TEST_USERS = [
     { email: "test@example.com", password: "test123" },
     { email: "admin@example.com", password: "admin123" },
   ];
   ```

### Future Considerations

1. **Multi-Tenant Support:**

   - User organizations stored in Firestore
   - Custom claims for organization roles
   - Organization-specific data isolation

2. **User Metadata Storage:**

   ```typescript
   interface UserMetadata {
     role: "user" | "admin";
     organizationId: string;
     preferences: {
       theme: "light" | "dark";
       notifications: boolean;
     };
   }
   ```

3. **SSR Authentication:**
   - Consider migration path to NextAuth.js
   - Server-side session validation
   - API route protection

[Previous Best Practices and Troubleshooting sections remain the same...]

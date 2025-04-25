"use client";
import { useState, useEffect } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [signInWithEmailAndPassword, user, loading, signInError] =
    useSignInWithEmailAndPassword(auth);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Successfully signed in with Google");
          setSuccess("Successfully signed in with Google! Redirecting...");
          sessionStorage.setItem("user", true);
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      } catch (e) {
        console.error("Redirect error:", e);
        setError(e.message || "An error occurred during Google sign in");
      }
    };

    // Check for redirect result when component mounts
    handleRedirectResult();

    // Set up auth state observer
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        const isRedirect = sessionStorage.getItem("googleRedirect");
        if (isRedirect) {
          setSuccess("Successfully signed in with Google! Redirecting...");
          sessionStorage.removeItem("googleRedirect");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const res = await signInWithEmailAndPassword(email, password);
      console.log("Sign in response:", res);

      if (res && res.user) {
        setSuccess("Successfully signed in! Redirecting...");
        sessionStorage.setItem("user", true);
        setEmail("");
        setPassword("");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (e) {
      console.error("Sign in error:", e);
      setError(e.message || "An error occurred during sign in");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      // Set flag before redirect
      sessionStorage.setItem("googleRedirect", "true");
      await signInWithRedirect(auth, provider);
    } catch (e) {
      console.error("Google sign in error:", e);
      setError(e.message || "An error occurred during Google sign in");
      setIsLoading(false);
      sessionStorage.removeItem("googleRedirect");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-10 rounded-lg shadow-xl w-96">
        <h1 className="text-white text-2xl mb-5">Sign In</h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 transition-all">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500 text-white p-3 rounded mb-4 transition-all">
            {success}
          </div>
        )}

        {signInError && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {signInError.message}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
          disabled={loading || isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
          disabled={loading || isLoading}
        />
        <button
          onClick={handleSignIn}
          disabled={loading || isLoading}
          className="w-full p-3 mb-4 bg-indigo-600 rounded text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed relative"
        >
          {loading ? (
            <>
              <span className="opacity-0">Sign In with Email</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            "Sign In with Email"
          )}
        </button>

        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-gray-600 w-full"></div>
          <div className="bg-gray-800 px-4 text-gray-400">or</div>
          <div className="border-t border-gray-600 w-full"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || isLoading}
          className="w-full p-3 bg-white text-gray-800 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative"
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Continue with Google</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-4 text-center text-gray-400">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
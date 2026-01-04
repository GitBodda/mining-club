// Firebase client configuration - using blueprint:firebase_barebones_javascript
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect, 
  signInWithPopup,
  getRedirectResult, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User
} from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const firebaseConfigured = Boolean(apiKey && projectId && appId);

let app: FirebaseApp | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

if (firebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      appId,
    };
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } catch (e) {
    console.error("Failed to initialize Firebase:", e);
    app = null;
    authInstance = null;
  }
} else {
  console.warn("Firebase not configured — client will run in read-only/mock mode.");
}

export const auth = authInstance;

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");

// Sign in with Google
export async function signInWithGoogle() {
  try {
    if (!auth) {
      console.warn("signInWithGoogle called but Firebase is not configured");
      return null;
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

// Sign in with Apple
export async function signInWithApple() {
  try {
    if (!auth) {
      console.warn("signInWithApple called but Firebase is not configured");
      return null;
    }
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error) {
    console.error("Apple sign-in error:", error);
    throw error;
  }
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
  try {
    if (!auth) {
      console.warn("signInWithEmail called but Firebase is not configured");
      return null;
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
}

// Register with email/password and optional display name
export async function registerWithEmail(email: string, password: string, displayName?: string) {
  try {
    if (!auth) {
      console.warn("registerWithEmail called but Firebase is not configured");
      return null;
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    if (result.user) {
      await sendEmailVerification(result.user);
    }
    return result.user;
  } catch (error) {
    console.error("Email registration error:", error);
    throw error;
  }
}

// Resend email verification
export async function resendVerificationEmail() {
  try {
    if (!auth) {
      console.warn("resendVerificationEmail called but Firebase is not configured");
      return false;
    }
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Resend verification error:", error);
    throw error;
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  try {
    if (!auth) {
      console.warn("resetPassword called but Firebase is not configured");
      return;
    }
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
}

// Sign out
export async function logOut() {
  try {
    if (!auth) {
      console.warn("logOut called but Firebase is not configured");
      return;
    }
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

// Handle redirect result (call on page load)
export async function handleRedirectResult() {
  try {
    if (!auth) {
      return null;
    }
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    throw error;
  }
}

// Auth state observer
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // No-op unsubscribe
    const unsub = () => {};
    return unsub;
  }
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}

// Get ID token for API calls
export async function getIdToken(): Promise<string | null> {
  if (!auth) return null;
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// Re-export User type
export type { User };

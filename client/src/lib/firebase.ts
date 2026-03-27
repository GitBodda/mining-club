// Firebase client configuration - using blueprint:firebase_barebones_javascript
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { 
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInWithCustomToken,
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
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { Capacitor } from '@capacitor/core';
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const firebaseConfigured = Boolean(apiKey && projectId && appId);

let app: FirebaseApp | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let messagingInstance: Messaging | null = null;

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
    // Use localStorage to avoid sessionStorage issues with redirect flows
    setPersistence(authInstance, browserLocalPersistence).catch((err) => {
      console.warn("Failed to set auth persistence to localStorage", err);
    });
    
    // Initialize messaging for push notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messagingInstance = getMessaging(app);
      } catch (msgError) {
        console.warn("Firebase Messaging not available:", msgError);
      }
    }
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
googleProvider.setCustomParameters({ prompt: "select_account" });
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

function shouldUseWebRedirectFallback(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (Capacitor.isNativePlatform()) return false; // never redirect on native
  const ua = navigator.userAgent || "";
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|Twitter|Snapchat|TikTok/i.test(ua);
  return isInAppBrowser;
}

/**
 * iOS-specific Google Sign-In using @capacitor/browser.
 *
 * Root cause: On Capacitor iOS, both signInWithPopup and signInWithRedirect open the
 * SYSTEM Safari browser. Firebase's popup flow relies on window.opener.postMessage()
 * which is null in an external browser, so the result never makes it back to the app.
 *
 * Solution: Open our own /google-auth helper page in an SFSafariViewController
 * (in-app browser via @capacitor/browser).  That page performs a proper
 * signInWithRedirect flow in a real browser context, then POSTs the Firebase ID token
 * to our backend.  The backend creates a Firebase custom token which the app
 * picks up by polling, then calls signInWithCustomToken to complete sign-in.
 */
async function googleSignInViaBrowser(): Promise<User | null> {
  const { Browser } = await import('@capacitor/browser');

  const sessionId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  let settled = false;
  let resolvePromise!: (u: User | null) => void;
  let rejectPromise!: (e: unknown) => void;

  const mainPromise = new Promise<User | null>((res, rej) => {
    resolvePromise = res;
    rejectPromise = rej;
  });

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners: Array<{ remove: () => void }> = [];

  const cleanup = () => {
    if (pollTimer) clearInterval(pollTimer);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    listeners.forEach(l => l.remove());
  };

  // Open the helper page
  try {
    await Browser.open({
      url: `https://hardisk.co/google-auth?sid=${sessionId}`,
      toolbarColor: '#0a0a0f',
      presentationStyle: 'fullscreen',
    });
  } catch (e) {
    rejectPromise(e);
    return mainPromise;
  }

  // Poll the backend every 1.5 s for the custom token
  pollTimer = setInterval(async () => {
    if (settled) return;
    try {
      const resp = await fetch(`/api/auth/google/result/${sessionId}`);
      if (resp.status === 410) {
        settled = true;
        cleanup();
        Browser.close().catch(() => {});
        rejectPromise(new Error('Session expired — please try again'));
        return;
      }
      const data: { ready: boolean; customToken?: string } = await resp.json();
      if (data.ready && data.customToken) {
        settled = true;
        cleanup();
        try {
          await Browser.close();
          const result = await signInWithCustomToken(auth!, data.customToken);
          resolvePromise(result.user);
        } catch (e) {
          rejectPromise(e);
        }
      }
    } catch (_) { /* network blip — retry next tick */ }
  }, 1500);

  // Hard timeout after 3 minutes
  timeoutTimer = setTimeout(() => {
    if (!settled) {
      settled = true;
      cleanup();
      Browser.close().catch(() => {});
      rejectPromise(new Error('TIMEOUT'));
    }
  }, 3 * 60 * 1000);

  // User manually closed the browser before auth completed
  Browser.addListener('browserFinished', async () => {
    if (settled) return;
    // One final check — helper page may have just finished posting the token
    try {
      const resp = await fetch(`/api/auth/google/result/${sessionId}`);
      const data: { ready: boolean; customToken?: string } = await resp.json();
      if (data.ready && data.customToken) {
        settled = true;
        cleanup();
        const result = await signInWithCustomToken(auth!, data.customToken);
        resolvePromise(result.user);
        return;
      }
    } catch (_) {}
    settled = true;
    cleanup();
    resolvePromise(null); // user cancelled
  }).then(l => listeners.push(l));

  return mainPromise;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    console.warn("signInWithGoogle called but Firebase is not configured");
    return null;
  }

  // iOS native: use a dedicated browser-based helper to avoid the external-browser trap
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    console.log("Using custom browser flow for iOS");
    return googleSignInViaBrowser();
  }

  // Native Android / Web: Always use popup (more reliable than redirect)
  // IMPORTANT: Avoid redirect flow for Capacitor apps - it opens external browser
  // and loses connection to the app, resulting in white screen
  try {
    console.log("Using popup flow for sign-in");
    const popupTimeoutMs = import.meta.env.PROD ? 14000 : 20000;
    
    const popupResult = await Promise.race([
      signInWithPopup(auth, googleProvider),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("POPUP_TIMEOUT")), popupTimeoutMs);
      }),
    ]);
    
    if (!popupResult.user) {
      throw new Error("No user returned from popup");
    }
    
    console.log("Popup sign-in successful for:", popupResult.user.email);
    return popupResult.user;
  } catch (error: any) {
    const err = error as any;
    const code = err?.code || "";
    const message = err?.message || "";
    
    console.error("Google sign-in error:", { code, message, error });
    
    // For any popup issues, log but don't fall back to redirect
    // Redirect would cause white screen on Capacitor apps
    if (message === "POPUP_TIMEOUT") {
      throw new Error("POPUP_TIMEOUT - Sign-in took too long. Please try again.");
    }
    
    if (code === "auth/popup-blocked") {
      throw new Error("POPUP_BLOCKED - Pop-up was blocked by browser. Please check your browser settings.");
    }
    
    if (code === "auth/popup-closed-by-user" || message.includes("User cancelled")) {
      throw new Error("User cancelled sign-in");
    }

    throw error;
  }
}

// Handle redirect result (used after signInWithRedirect on web)
export async function getRedirectAuthResult() {
  if (!auth) {
    console.warn("getRedirectAuthResult: auth not initialized");
    return null;
  }
  try {
    console.log("getRedirectAuthResult: Calling getRedirectResult from Firebase...");
    const res = await getRedirectResult(auth);
    console.log("getRedirectAuthResult: Result returned", { hasUser: !!res?.user, email: res?.user?.email });
    
    // Even if res is null, Firebase has updated its internal state
    // The auth state listener (onAuthStateChanged) will fire if user is logged in
    return res?.user || null;
  } catch (err) {
    console.error("Redirect auth result error:", err);
    // Log full error details to help debugging
    if (err instanceof Error) {
      console.error("  Name:", err.name);
      console.error("  Message:", err.message);
      console.error("  Code:", (err as any).code);
    }
    throw err;
  }
}

// Sign in with Apple
export async function signInWithApple() {
  try {
    if (!auth) {
      console.warn("signInWithApple called but Firebase is not configured");
      return null;
    }
    
    // Check if we're on native iOS
    if (Capacitor.getPlatform() === 'ios') {
      const startTotal = Date.now();
      console.log('[AppleAuth] Starting native iOS Sign in with Apple...');
      
      // Import nativeServices (already bundled, no dynamic import delay)
      const { nativeAppleSignIn } = await import('./nativeServices');
      console.log('[AppleAuth] Import took:', Date.now() - startTotal, 'ms');
      
      // Generate a cryptographically secure nonce
      const generateNonce = (length: number = 32): string => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
          result += charset[randomValues[i] % charset.length];
        }
        return result;
      };
      
      // SHA256 hash function for the nonce
      const sha256 = async (plain: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };
      
      // Generate raw nonce and its hash
      const nonceStart = Date.now();
      const rawNonce = generateNonce();
      const hashedNonce = await sha256(rawNonce);
      console.log('[AppleAuth] Nonce generation took:', Date.now() - nonceStart, 'ms');
      
      console.log('[AppleAuth] Calling native Apple Sign-In...');
      const appleStart = Date.now();
      
      // Call native Apple Sign-In with the hashed nonce
      const result = await nativeAppleSignIn(hashedNonce);
      console.log('[AppleAuth] Native Sign-In took:', Date.now() - appleStart, 'ms');
      
      console.log('[AppleAuth] Native result:', JSON.stringify({ success: result.success, hasUser: !!result.user, error: result.error }));
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Apple Sign-In failed');
      }
      
      console.log('[AppleAuth] Got identity token, creating Firebase credential...');
      const firebaseStart = Date.now();
      
      // Create Firebase credential with the RAW nonce (not hashed)
      const credential = appleProvider.credential({
        idToken: result.user.identityToken,
        rawNonce: rawNonce
      });
      
      console.log('[AppleAuth] Signing in to Firebase...');
      const firebaseResult = await signInWithCredential(auth, credential);
      console.log('[AppleAuth] Firebase sign-in took:', Date.now() - firebaseStart, 'ms');
      console.log('[AppleAuth] Total time:', Date.now() - startTotal, 'ms');
      
      // Update display name if provided by Apple (only on first sign-in)
      if (result.user.givenName || result.user.familyName) {
        const displayName = [result.user.givenName, result.user.familyName]
          .filter(Boolean)
          .join(' ');
        if (displayName && firebaseResult.user) {
          await updateProfile(firebaseResult.user, { displayName });
        }
      }
      
      return firebaseResult.user;
    } else {
      // Use Firebase popup for web/Android
      console.log('[AppleAuth] Using web popup for Apple Sign-In...');
      const result = await signInWithPopup(auth, appleProvider);
      return result.user;
    }
  } catch (error: any) {
    console.error("[AppleAuth] Apple sign-in error:", error);
    console.error("[AppleAuth] Error details:", JSON.stringify(error));
    // Re-throw with more user-friendly message for cancellation
    if (error.message?.includes('cancel') || error.message?.includes('User cancelled')) {
      throw new Error('User cancelled Apple Sign-In');
    }
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

// Push Notifications
export const messaging = messagingInstance;

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messagingInstance) {
    console.warn("Firebase Messaging not initialized");
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const token = await getToken(messagingInstance, { vapidKey });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messagingInstance) {
    return () => {}; // No-op unsubscribe
  }
  return onMessage(messagingInstance, callback);
}

// Firebase client configuration - using blueprint:firebase_barebones_javascript
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { 
  getAuth,
  signInWithPopup,
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

/**
 * Google Sign-In — uses system browser on native, popup on web.
 *
 * On native Capacitor (iOS/Android), Google blocks OAuth from embedded WebViews
 * (WKWebView / Android WebView) with "disallowed_useragent". To fix this:
 *   1. Open the OAuth flow in the system browser (SFSafariViewController / Chrome Custom Tab)
 *      via @capacitor/browser — Google allows these.
 *   2. Server handles the OAuth exchange and creates a Firebase custom token.
 *   3. App polls for the custom token and uses signInWithCustomToken.
 *
 * On web browsers, the popup flow works fine.
 */

/**
 * Detect if we're running inside a native mobile WebView.
 * Capacitor.getPlatform() can return 'web' even inside the native app
 * when using server.url (remote loading), so we check multiple signals.
 */
function isNativeWebView(): 'ios' | 'android' | false {
  // Check Capacitor's own detection first
  const platform = Capacitor.getPlatform();
  if (platform === 'ios' || platform === 'android') return platform;
  if (Capacitor.isNativePlatform()) return detectMobilePlatform();

  // Fallback: check user agent for WebView signatures
  const ua = navigator.userAgent || '';

  // iOS WKWebView: contains "Mobile" but NOT "Safari", or contains the app's scheme
  const isIOSWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
  // Also detect Capacitor bridge injection
  const hasCapBridge = !!(window as any).Capacitor?.isNativePlatform?.();

  // Android WebView: contains "wv" flag or "Version/X.X" pattern
  const isAndroidWebView = /Android/.test(ua) && (/wv/.test(ua) || /Version\/[\d.]+/.test(ua) && !/Chrome\/[\d.]+ Mobile Safari/.test(ua));

  if (isIOSWebView || (hasCapBridge && /iPhone|iPad|iPod/.test(ua))) return 'ios';
  if (isAndroidWebView || (hasCapBridge && /Android/.test(ua))) return 'android';

  return false;
}

function detectMobilePlatform(): 'ios' | 'android' {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) ? 'ios' : 'android';
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    console.warn("signInWithGoogle called but Firebase is not configured");
    return null;
  }

  const nativePlatform = isNativeWebView();
  console.log("Google sign-in — native platform detected:", nativePlatform, "| Capacitor.getPlatform():", Capacitor.getPlatform());

  // ── Native platforms: use system browser flow ──
  if (nativePlatform) {
    return signInWithGoogleNative();
  }

  // ── Web: use popup flow ──
  try {
    const popupTimeoutMs = 45000;

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

/**
 * Native Google Sign-In via system browser + server-mediated OAuth.
 * Opens SFSafariViewController (iOS) or Chrome Custom Tab (Android).
 * Falls back to window.open() if Capacitor Browser plugin isn't available.
 */
async function signInWithGoogleNative(): Promise<User | null> {
  // Generate a unique session ID
  const sid = crypto.randomUUID();
  console.log('[GoogleNative] Opening system browser for Google sign-in, sid:', sid);

  // Try Capacitor Browser plugin first, fall back to window.open
  let Browser: any = null;
  try {
    const mod = await import('@capacitor/browser');
    Browser = mod.Browser;
    await Browser.open({
      url: `https://hardisk.co/google-auth?sid=${encodeURIComponent(sid)}`,
      presentationStyle: 'popover',
    });
  } catch (e) {
    console.warn('[GoogleNative] Capacitor Browser plugin failed, falling back to window.open:', e);
    window.open(`https://hardisk.co/google-auth?sid=${encodeURIComponent(sid)}`, '_blank');
  }

  // Poll the server for the auth result
  const POLL_INTERVAL = 2000;  // 2 seconds
  const POLL_TIMEOUT = 120000; // 2 minutes max
  const startTime = Date.now();

  return new Promise<User | null>((resolve, reject) => {
    let pollTimer: ReturnType<typeof setInterval>;
    let browserFinishedListener: any;

    const cleanup = () => {
      clearInterval(pollTimer);
      if (browserFinishedListener) {
        browserFinishedListener.then?.((l: any) => l.remove?.());
      }
    };

    const checkResult = async () => {
      try {
        const res = await fetch(`/api/auth/google/result/${encodeURIComponent(sid)}`);
        const data = await res.json();

        if (data.ready && data.customToken) {
          cleanup();
          try { if (Browser) await Browser.close(); } catch (_) { /* browser may already be closed */ }
          console.log('[GoogleNative] Got custom token, signing in to Firebase...');
          const userCred = await signInWithCustomToken(auth!, data.customToken);
          console.log('[GoogleNative] Firebase sign-in successful:', userCred.user.email);
          resolve(userCred.user);
          return;
        }

        // Check timeout
        if (Date.now() - startTime > POLL_TIMEOUT) {
          cleanup();
          reject(new Error("POPUP_TIMEOUT - Sign-in took too long. Please try again."));
        }
      } catch (err) {
        console.warn('[GoogleNative] Poll error (will retry):', err);
      }
    };

    // Start polling
    pollTimer = setInterval(checkResult, POLL_INTERVAL);

    // Also listen for browser close (user tapped "Done") — only if Capacitor Browser is available
    if (Browser) {
      Browser.addListener('browserFinished', async () => {
        console.log('[GoogleNative] Browser closed by user');
        await new Promise(r => setTimeout(r, 1500));
        try {
          const res = await fetch(`/api/auth/google/result/${encodeURIComponent(sid)}`);
          const data = await res.json();
          if (data.ready && data.customToken) {
            cleanup();
            const userCred = await signInWithCustomToken(auth!, data.customToken);
            resolve(userCred.user);
            return;
          }
        } catch (_) {}
        cleanup();
        reject(new Error("User cancelled sign-in"));
      }).then((listener: any) => { browserFinishedListener = Promise.resolve(listener); });
    }
  });
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
    
    const nativePlatform = isNativeWebView();
    console.log('[AppleAuth] Native platform detected:', nativePlatform, '| Capacitor.getPlatform():', Capacitor.getPlatform());

    // Check if we're on native iOS — use native Apple Sign-In plugin
    if (nativePlatform === 'ios') {
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
    } else if (nativePlatform === 'android') {
      // Android: use system browser flow (WebView blocks Apple OAuth too)
      console.log('[AppleAuth] Using system browser flow for Android...');
      return signInWithAppleNative();
    } else {
      // Use Firebase popup for web
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

/**
 * Native Apple Sign-In via system browser (for Android).
 * Same pattern as signInWithGoogleNative but for Apple provider.
 */
async function signInWithAppleNative(): Promise<User | null> {
  if (!auth) return null;

  const sid = crypto.randomUUID();
  console.log('[AppleNative] Opening system browser for Apple sign-in, sid:', sid);

  let Browser: any = null;
  try {
    const mod = await import('@capacitor/browser');
    Browser = mod.Browser;
    await Browser.open({
      url: `https://hardisk.co/apple-auth?sid=${encodeURIComponent(sid)}`,
      presentationStyle: 'popover',
    });
  } catch (e) {
    console.warn('[AppleNative] Capacitor Browser plugin failed, falling back to window.open:', e);
    window.open(`https://hardisk.co/apple-auth?sid=${encodeURIComponent(sid)}`, '_blank');
  }

  const POLL_INTERVAL = 2000;
  const POLL_TIMEOUT = 120000;
  const startTime = Date.now();

  return new Promise<User | null>((resolve, reject) => {
    let pollTimer: ReturnType<typeof setInterval>;
    let browserFinishedListener: any;

    const cleanup = () => {
      clearInterval(pollTimer);
      if (browserFinishedListener) {
        browserFinishedListener.then?.((l: any) => l.remove?.());
      }
    };

    const checkResult = async () => {
      try {
        const res = await fetch(`/api/auth/apple/result/${encodeURIComponent(sid)}`);
        const data = await res.json();

        if (data.ready && data.customToken) {
          cleanup();
          try { if (Browser) await Browser.close(); } catch (_) {}
          console.log('[AppleNative] Got custom token, signing in to Firebase...');
          const userCred = await signInWithCustomToken(auth!, data.customToken);
          console.log('[AppleNative] Firebase sign-in successful:', userCred.user.email);
          resolve(userCred.user);
          return;
        }

        if (Date.now() - startTime > POLL_TIMEOUT) {
          cleanup();
          reject(new Error("POPUP_TIMEOUT - Sign-in took too long. Please try again."));
        }
      } catch (err) {
        console.warn('[AppleNative] Poll error (will retry):', err);
      }
    };

    pollTimer = setInterval(checkResult, POLL_INTERVAL);

    if (Browser) {
      Browser.addListener('browserFinished', async () => {
        console.log('[AppleNative] Browser closed by user');
        await new Promise(r => setTimeout(r, 1500));
        try {
          const res = await fetch(`/api/auth/apple/result/${encodeURIComponent(sid)}`);
          const data = await res.json();
          if (data.ready && data.customToken) {
            cleanup();
            const userCred = await signInWithCustomToken(auth!, data.customToken);
            resolve(userCred.user);
            return;
          }
        } catch (_) {}
        cleanup();
        reject(new Error("User cancelled Apple Sign-In"));
      }).then((listener: any) => { browserFinishedListener = Promise.resolve(listener); });
    }
  });
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

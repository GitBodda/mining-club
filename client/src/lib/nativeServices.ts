/**
 * Native Services - Capacitor Plugin Wrappers
 * 
 * This module provides unified access to native device features:
 * - Face ID (iOS only via custom native plugin)
 * - Push Notifications
 * - Apple Sign-In (native implementation)
 * 
 * All functions gracefully handle web browser environment
 * by providing fallbacks or no-op implementations.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// ============================================================
// PLATFORM DETECTION
// ============================================================

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

// ============================================================
// FACE ID (iOS ONLY)
// ============================================================

interface FaceIDIsAvailableResult {
  isAvailable: boolean;
  biometryType: string;
  passcodeAvailable?: boolean;
  errorCode?: number;
  errorMessage?: string;
}

interface FaceIDAuthResult {
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
  cancelled?: boolean;
}

interface FaceIDPlugin {
  isAvailable(): Promise<FaceIDIsAvailableResult>;
  authenticate(options: { reason: string; useFallback?: boolean }): Promise<FaceIDAuthResult>;
}

// Register the custom FaceIDPlugin (iOS only)
const FaceID = registerPlugin<FaceIDPlugin>('FaceIDPlugin');

interface BiometricResult {
  success: boolean;
  error?: string;
}

interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: 'face' | 'fingerprint' | 'iris' | 'none';
  errorMessage?: string;
}

/**
 * Check if Face ID is available on this device
 * Only available on iOS - returns not available for Android and web
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  // Face ID is iOS only
  if (!isIOS()) {
    console.log('[FaceID] Not iOS - Face ID unavailable');
    return {
      isAvailable: false,
      biometryType: 'none',
      errorMessage: 'Face ID is only available on iOS devices'
    };
  }
  
  try {
    console.log('[FaceID] Checking availability on iOS...');
    console.log('[FaceID] Capacitor platform:', Capacitor.getPlatform());
    console.log('[FaceID] Is native:', Capacitor.isNativePlatform());
    
    const result = await FaceID.isAvailable();
    console.log('[FaceID] Availability result:', JSON.stringify(result));
    
    // Map biometry type
    let biometryType: 'face' | 'fingerprint' | 'iris' | 'none' = 'none';
    if (result.biometryType === 'face') {
      biometryType = 'face';
    } else if (result.biometryType === 'fingerprint') {
      biometryType = 'fingerprint';
    }
    
    return {
      isAvailable: result.isAvailable,
      biometryType,
      errorMessage: result.errorMessage
    };
  } catch (error) {
    console.error('[FaceID] Error checking availability:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[FaceID] Error message:', errorMsg);
    return {
      isAvailable: false,
      biometryType: 'none',
      errorMessage: errorMsg || 'Failed to check Face ID availability'
    };
  }
}

/**
 * Authenticate user with Face ID
 * Only available on iOS - returns failure for Android and web
 */
export async function authenticateWithBiometrics(
  reason: string = 'Verify your identity'
): Promise<BiometricResult> {
  // Face ID is iOS only
  if (!isIOS()) {
    console.log('[FaceID] Not iOS - authentication unavailable');
    return {
      success: false,
      error: 'Face ID is only available on iOS devices'
    };
  }
  
  try {
    console.log('[FaceID] Starting authentication...');
    const result = await FaceID.authenticate({
      reason,
      useFallback: true // Allow passcode fallback
    });
    console.log('[FaceID] Authentication result:', result);
    
    return {
      success: result.success,
      error: result.errorMessage
    };
  } catch (error) {
    console.error('[FaceID] Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Face ID authentication failed'
    };
  }
}

// Credential storage functions - not implemented for custom plugin
// (we only use Face ID for authentication, not credential storage)
export async function setCredentials(
  server: string,
  username: string,
  password: string
): Promise<boolean> {
  console.log('[FaceID] Credential storage not implemented');
  return false;
}

export async function getCredentials(
  server: string
): Promise<{ username: string; password: string } | null> {
  console.log('[FaceID] Credential retrieval not implemented');
  return null;
}

export async function deleteCredentials(server: string): Promise<boolean> {
  console.log('[FaceID] Credential deletion not implemented');
  return false;
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

interface PushNotificationToken {
  token: string;
}

let PushNotifications: any = null;

// Lazy load push notifications plugin
async function getPushPlugin() {
  if (PushNotifications) return PushNotifications;
  
  if (!isNativePlatform()) {
    console.log('Push Notifications: Using Firebase web SDK');
    return null;
  }
  
  try {
    const module = await import('@capacitor/push-notifications');
    PushNotifications = module.PushNotifications;
    return PushNotifications;
  } catch (error) {
    console.error('Failed to load push plugin:', error);
    return null;
  }
}

/**
 * Request push notification permissions
 */
export async function requestPushPermissions(): Promise<boolean> {
  const plugin = await getPushPlugin();
  
  if (!plugin) {
    // Fall back to web notifications API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  
  try {
    const result = await plugin.requestPermissions();
    return result.receive === 'granted';
  } catch (error) {
    console.error('Failed to request push permissions:', error);
    return false;
  }
}

/**
 * Register for push notifications and get device token
 */
export async function registerPushNotifications(): Promise<string | null> {
  const plugin = await getPushPlugin();
  
  if (!plugin) {
    // Use Firebase web messaging
    try {
      const { requestNotificationPermission } = await import('@/lib/firebase');
      return await requestNotificationPermission();
    } catch (error) {
      console.error('Firebase messaging error:', error);
      return null;
    }
  }
  
  try {
    // Register with APNs/FCM
    await plugin.register();
    
    // Get the token
    return new Promise((resolve) => {
      plugin.addListener('registration', (token: PushNotificationToken) => {
        console.log('Push registration success, token:', token.token);
        resolve(token.token);
      });
      
      plugin.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
        resolve(null);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(null), 10000);
    });
  } catch (error) {
    console.error('Failed to register for push:', error);
    return null;
  }
}

/**
 * Add listener for received push notifications
 */
export async function addPushNotificationListener(
  callback: (notification: any) => void
): Promise<() => void> {
  const plugin = await getPushPlugin();
  
  if (!plugin) {
    // Use Firebase web messaging
    try {
      const { onForegroundMessage } = await import('@/lib/firebase');
      return onForegroundMessage(callback);
    } catch (error) {
      return () => {};
    }
  }
  
  const listener = await plugin.addListener('pushNotificationReceived', callback);
  return () => listener.remove();
}

/**
 * Add listener for when user taps a notification
 */
export async function addPushNotificationActionListener(
  callback: (notification: any) => void
): Promise<() => void> {
  const plugin = await getPushPlugin();
  
  if (!plugin) return () => {};
  
  const listener = await plugin.addListener('pushNotificationActionPerformed', callback);
  return () => listener.remove();
}

// ============================================================
// APPLE SIGN-IN (Native)
// ============================================================

interface AppleSignInResult {
  success: boolean;
  user?: {
    email: string | null;
    givenName: string | null;
    familyName: string | null;
    identityToken: string;
    authorizationCode: string;
  };
  error?: string;
}

// Pre-import Apple Sign-In plugin to avoid lazy loading delay
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

// Get Apple Sign-In plugin - returns immediately since it's pre-imported
function getAppleSignInPlugin() {
  if (!isIOS()) {
    console.log('Apple Sign-In: Only available on iOS');
    return null;
  }
  return SignInWithApple;
}

/**
 * Perform native Apple Sign-In on iOS
 * @param hashedNonce - SHA256 hashed nonce for Firebase authentication
 */
export async function nativeAppleSignIn(hashedNonce?: string): Promise<AppleSignInResult> {
  const plugin = getAppleSignInPlugin();
  
  if (!plugin) {
    return {
      success: false,
      error: 'Apple Sign-In not available on this platform'
    };
  }
  
  try {
    console.log('[AppleSignIn] Starting native Apple Sign-In...');
    console.log('[AppleSignIn] Platform:', Capacitor.getPlatform());
    console.log('[AppleSignIn] Plugin available:', !!plugin);
    
    // Options for Apple Sign-In
    const options: any = {
      scopes: 'email name',
    };
    
    // Add nonce for Firebase auth
    if (hashedNonce) {
      options.nonce = hashedNonce;
      console.log('[AppleSignIn] Nonce configured for Firebase');
    }
    
    console.log('[AppleSignIn] Calling plugin.authorize - showing Apple Sign-In sheet...');
    const startTime = Date.now();
    
    // Call the native authorize - this will show the Apple Sign-In sheet
    const response = await plugin.authorize(options);
    
    console.log('[AppleSignIn] Response received in', Date.now() - startTime, 'ms');
    
    console.log('[AppleSignIn] Got response');
    
    // Handle different response structures from the plugin
    // Some versions wrap in .response, others return directly
    const userData = response?.response || response;
    
    console.log('[AppleSignIn] User data received:', !!userData);
    
    if (!userData || !userData.identityToken) {
      console.error('[AppleSignIn] No identity token in response');
      return {
        success: false,
        error: 'No identity token received from Apple'
      };
    }
    
    console.log('[AppleSignIn] Success! Identity token received');
    
    return {
      success: true,
      user: {
        email: userData.email || null,
        givenName: userData.givenName || null,
        familyName: userData.familyName || null,
        identityToken: userData.identityToken,
        authorizationCode: userData.authorizationCode || ''
      }
    };
  } catch (error: any) {
    console.error('[AppleSignIn] Error:', error);
    console.error('[AppleSignIn] Error message:', error?.message);
    console.error('[AppleSignIn] Error code:', error?.code);
    
    // Handle user cancellation gracefully
    const errorStr = JSON.stringify(error).toLowerCase();
    const isCancelled = 
      error?.message?.toLowerCase().includes('cancel') || 
      error?.code === 1001 || 
      error?.code === '1001' ||
      errorStr.includes('cancel') ||
      errorStr.includes('1001');

    if (isCancelled) {
      console.log('[AppleSignIn] User cancelled');
      return {
        success: false,
        error: 'User cancelled Apple Sign-In'
      };
    }
    
    return {
      success: false,
      error: error?.message || 'Apple Sign-In failed'
    };
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize all native services
 */
export async function initializeNativeServices(): Promise<void> {
  if (!isNativePlatform()) {
    console.log('Native services: Running on web, using web fallbacks');
    return;
  }
  
  console.log('Native services: Initializing for', getPlatform());
  
  // Pre-load plugins (Face ID is registered automatically)
  await Promise.allSettled([
    getPushPlugin(),
    getAppleSignInPlugin()
  ]);
  
  console.log('Native services: Initialization complete');
}

export default {
  isNativePlatform,
  getPlatform,
  isIOS,
  isAndroid,
  
  // Face ID / Touch ID
  checkBiometricAvailability,
  authenticateWithBiometrics,
  setCredentials,
  getCredentials,
  deleteCredentials,
  
  // Push Notifications
  requestPushPermissions,
  registerPushNotifications,
  addPushNotificationListener,
  addPushNotificationActionListener,
  
  // Apple Sign-In
  nativeAppleSignIn,
  
  // Init
  initializeNativeServices
};

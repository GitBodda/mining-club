// Firebase Admin SDK for server-side authentication verification
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

// Initialize Firebase Admin with service account or project ID
export function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    return;
  }

  // Using project ID from environment variable
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn("Firebase project ID not configured. Auth verification will be disabled.");
    return;
  }

  try {
    adminApp = initializeApp({
      projectId: projectId,
    });
    adminAuth = getAuth(adminApp);
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

// Verify ID token from client
export async function verifyIdToken(idToken: string) {
  if (!adminAuth) {
    throw new Error("Firebase Admin not initialized");
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
}

// Get user by UID
export async function getUserByUid(uid: string) {
  if (!adminAuth) {
    throw new Error("Firebase Admin not initialized");
  }
  
  return await adminAuth.getUser(uid);
}

// Set custom claims (for admin role)
export async function setCustomClaims(uid: string, claims: { admin?: boolean; role?: string }) {
  if (!adminAuth) {
    throw new Error("Firebase Admin not initialized");
  }
  
  await adminAuth.setCustomUserClaims(uid, claims);
}

// Get auth instance
export function getAdminAuth() {
  return adminAuth;
}

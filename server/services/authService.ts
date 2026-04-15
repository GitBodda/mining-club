// Authentication Service
// Handles user authentication, registration, and session management

import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { verifyIdToken, setCustomClaims, deleteUser as deleteFirebaseUser } from "../firebase-admin";

export interface AuthResult {
  success: boolean;
  user?: schema.User;
  error?: string;
  isNewUser?: boolean;
}

export interface TokenPayload {
  uid: string;
  email?: string;
  admin?: boolean;
  role?: string;
}

export const authService = {
  /**
   * Verify Firebase ID token and return user data
   */
  async verifyToken(idToken: string): Promise<TokenPayload | null> {
    try {
      const decoded = await verifyIdToken(idToken);
      console.log("authService.verifyToken: decoded token uid:", decoded?.uid, "email:", decoded?.email);
      return decoded;
    } catch (error) {
      console.error("Token verification failed:", error);
      throw error; // Re-throw so caller knows verification failed
    }
  },

  /**
   * Get or create user from Firebase auth
   */
  async getOrCreateUser(firebaseUid: string, email: string, displayName?: string, photoUrl?: string): Promise<AuthResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Resolve admin role once and reuse for both existing/new users
      const adminEmail = await db.select().from(schema.adminEmails)
        .where(and(
          sql`lower(${schema.adminEmails.email}) = ${normalizedEmail}`,
          eq(schema.adminEmails.isActive, true)
        ));

      const shouldBeAdmin = adminEmail.length > 0;
      const adminRole = shouldBeAdmin ? adminEmail[0].role : "user";

      // Check if user exists
      const existingUsers = await db.select().from(schema.users)
        .where(eq(schema.users.firebaseUid, firebaseUid));

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const newRole = shouldBeAdmin ? adminRole : existingUser.role;
        
        // Update last login and role if needed
        const [updatedUser] = await db.update(schema.users)
          .set({ 
            lastLoginAt: new Date(),
            email: normalizedEmail,
            role: newRole 
          })
          .where(eq(schema.users.id, existingUser.id))
          .returning();
        
        // Update Firebase custom claims if role changed to admin
        if (shouldBeAdmin && existingUser.role !== newRole) {
          await setCustomClaims(firebaseUid, { admin: true, role: newRole });
        }
        
        return { success: true, user: updatedUser, isNewUser: false };
      }

      // Fallback: if same email exists (legacy/manual user), link it to this Firebase UID.
      const emailUsers = await db.select().from(schema.users)
        .where(sql`lower(${schema.users.email}) = ${normalizedEmail}`);

      if (emailUsers.length > 0) {
        const existingByEmail = emailUsers[0];

        // If email belongs to another Firebase UID, do not overwrite silently.
        if (existingByEmail.firebaseUid && existingByEmail.firebaseUid !== firebaseUid) {
          return { success: false, error: "Email is linked to another account" };
        }

        const newRole = shouldBeAdmin ? adminRole : existingByEmail.role;
        const [updatedUser] = await db.update(schema.users)
          .set({
            firebaseUid,
            displayName: displayName || existingByEmail.displayName || normalizedEmail.split("@")[0],
            photoUrl: photoUrl || existingByEmail.photoUrl,
            role: newRole,
            isActive: true,
            lastLoginAt: new Date(),
          })
          .where(eq(schema.users.id, existingByEmail.id))
          .returning();

        if (shouldBeAdmin && existingByEmail.role !== newRole) {
          await setCustomClaims(firebaseUid, { admin: true, role: newRole });
        }

        return { success: true, user: updatedUser, isNewUser: false };
      }

      // Create new user
      const [newUser] = await db.insert(schema.users).values({
        firebaseUid,
        email: normalizedEmail,
        displayName: displayName || normalizedEmail.split("@")[0],
        photoUrl,
        role: adminRole,
        isActive: true,
        lastLoginAt: new Date(),
      }).returning();

      // Set Firebase custom claims if admin
      if (shouldBeAdmin) {
        await setCustomClaims(firebaseUid, { admin: true, role: adminRole });
      }

      // Create default wallets for new user
      await this.createDefaultWallets(newUser.id);

      // Create default notification preferences
      await db.insert(schema.notificationPreferences).values({
        userId: newUser.id,
      }).onConflictDoNothing();

      // ── Growth system: check founder status (starter miner granted via invite code only) ──
      // This is intentionally fire-and-forget so it never blocks auth
      setImmediate(async () => {
        try {
          const { growthService } = await import("./growthService");
          // NOTE: starter miner is no longer auto-granted here.
          // Users must redeem an invite code via POST /api/invite/redeem
          await growthService.checkAndGrantFounderStatus(newUser.id);

          // If referral code was supplied in the request context, attribute it
          // (also handled in /api/growth/attribute-referral for client-side attribution)
        } catch (err) {
          console.error("Growth system post-signup error (non-fatal):", err);
        }
      });

      return { success: true, user: newUser, isNewUser: true };
    } catch (error) {
      console.error("Error in getOrCreateUser:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Failed to get or create user: ${errorMessage}` };
    }
  },

  /**
   * Create default wallets for a new user
   */
  async createDefaultWallets(userId: string): Promise<void> {
    const defaultWallets = [
      { symbol: "BTC", name: "Bitcoin" },
      { symbol: "LTC", name: "Litecoin" },
      { symbol: "USDT", name: "Tether" },
      { symbol: "USDC", name: "USD Coin" },
    ];

    for (const wallet of defaultWallets) {
      await db.insert(schema.wallets).values({
        userId,
        symbol: wallet.symbol,
        name: wallet.name,
        balance: 0,
      }).onConflictDoNothing();
    }
  },

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.id, userId));
    
    return users.length > 0 && users[0].role === "admin";
  },

  /**
   * Check if email is designated as admin
   */
  async isAdminEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmails = await db.select().from(schema.adminEmails)
      .where(and(
        sql`lower(${schema.adminEmails.email}) = ${normalizedEmail}`,
        eq(schema.adminEmails.isActive, true)
      ));
    
    return adminEmails.length > 0;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { displayName?: string; photoUrl?: string }): Promise<AuthResult> {
    try {
      const [updatedUser] = await db.update(schema.users)
        .set(data)
        .where(eq(schema.users.id, userId))
        .returning();
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: "Failed to update profile" };
    }
  },

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<AuthResult> {
    try {
      const [user] = await db.update(schema.users)
        .set({ isActive: false })
        .where(eq(schema.users.id, userId))
        .returning();
      
      return { success: true, user };
    } catch (error) {
      console.error("Error deactivating user:", error);
      return { success: false, error: "Failed to deactivate user" };
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<schema.User | null> {
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.id, userId));
    
    return users.length > 0 ? users[0] : null;
  },

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<schema.User | null> {
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.firebaseUid, firebaseUid));
    
    return users.length > 0 ? users[0] : null;
  },
};

export default authService;

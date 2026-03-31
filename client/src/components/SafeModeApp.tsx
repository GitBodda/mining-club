/**
 * Safe Mode App Shell (Compliance Mode)
 * 
 * This is a completely different app shell for when isComplianceMode === true.
 * It renders a "Server Management Utility" with NO crypto references.
 * 
 * Tabs: Home, Metrics, News, Settings
 * Header: Simple "BlockMint Node Manager" title, NO hamburger menu
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

import { SafeBottomNav } from "@/components/SafeBottomNav";
import { SafeHeader } from "@/components/SafeHeader";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { SafeHome } from "@/pages/SafeHome";
import { SafeMetrics } from "@/pages/SafeMetrics";
import { SafeSettings } from "@/pages/SafeSettings";
import { News } from "@/pages/News";
import { SafeOnboarding } from "@/pages/SafeOnboarding";
import { SafeAuthPage } from "@/pages/SafeAuthPage";
import { ForceUpdateModal } from "@/components/ForceUpdateModal";
import { SafeAppLockProvider } from "@/components/SafeAppLock";
import { onAuthChange, logOut } from "@/lib/firebase";
import { useKeyboardAdjustment } from "@/hooks/useKeyboardAdjustment";
import type { User } from "firebase/auth";

type SafeTabType = "home" | "metrics" | "news" | "settings";
type AppView = "onboarding" | "auth" | "main";
type AuthMode = "signin" | "register";

export function SafeModeApp() {
  const [location, setLocation] = useLocation();
  const [appView, setAppView] = useState<AppView>("onboarding");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // Apply keyboard adjustment globally
  useKeyboardAdjustment();

  // Determine active tab from location
  const getActiveTab = (): SafeTabType => {
    if (location === "/" || location === "/home") return "home";
    if (location === "/metrics") return "metrics";
    if (location === "/news") return "news";
    if (location === "/settings") return "settings";
    return "home";
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (hasSeenOnboarding && isLoggedIn) {
      setAppView("main");
    } else if (hasSeenOnboarding) {
      setAppView("auth");
    }
  }, []);

  // Track Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        localStorage.setItem("isLoggedIn", "true");
      } else {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        if (appView === "main") {
          setAppView("auth");
        }
      }
    });
    return () => unsubscribe();
  }, [appView]);

  // Sync Firebase user into backend (simplified for safe mode)
  useEffect(() => {
    const syncUser = async () => {
      if (!firebaseUser) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          const storedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            id: data.user?.id,
            dbId: data.user?.id,
            role: data.user?.role,
            createdAt: data.user?.createdAt,
          };
          localStorage.setItem("user", JSON.stringify(storedUser));
        }

        if (appView === "auth") {
          setAppView("main");
        }
      } catch (error) {
        console.error("User sync failed:", error);
      }
    };

    if (firebaseUser) {
      syncUser();
    }
  }, [firebaseUser, appView]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setAppView("auth");
  };

  const handleAuthComplete = () => {
    localStorage.setItem("isLoggedIn", "true");
    setAppView("main");
  };

  const handleSignIn = () => {
    setAuthMode("signin");
    setAppView("auth");
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    // Skip onboarding but go to auth page (not main)
    setAppView("auth");
  };

  // Onboarding view - Safe version (no signup option)
  if (appView === "onboarding") {
    return (
      <div className="min-h-screen">
        <SafeOnboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Auth view - Safe version (sign in only, no sign up)
  if (appView === "auth") {
    return (
      <div className="min-h-screen">
        <SafeAuthPage 
          onAuthSuccess={handleAuthComplete} 
          onBack={() => {
            localStorage.removeItem("hasSeenOnboarding");
            setAppView("onboarding");
          }}
        />
      </div>
    );
  }

  // Get user ID for AppLock
  const userId = firebaseUser?.uid;

  // Main Safe Mode app - wrapped with SafeAppLockProvider
  return (
    <SafeAppLockProvider userId={userId}>
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
        <ForceUpdateModal />
      </div>

      {/* Scroll-aware background for system status bar */}
      <ScrollAwareStatusBar />
      
      {/* Spacer for system status bar - reduced spacing */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      {/* Main Content */}
      <main className="relative z-10 max-w-md mx-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="safe-home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SafeHome />
            </motion.div>
          )}
          {activeTab === "metrics" && (
            <motion.div
              key="safe-metrics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SafeMetrics />
            </motion.div>
          )}
          {activeTab === "news" && (
            <motion.div
              key="safe-news"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <News />
            </motion.div>
          )}
          {activeTab === "settings" && (
            <motion.div
              key="safe-settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SafeSettings />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safe Mode Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center space-y-4 pb-safe"
        >
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 rounded-full blur-xl" />
            <img 
              src="/attached_assets/BlockMint-for-All.png" 
              alt="BlockMint" 
              className="h-28 w-auto object-contain relative z-10"
              style={{
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 15px rgba(16, 185, 129, 0.25)) contrast(1.1) saturate(1.2)',
                imageRendering: '-webkit-optimize-contrast',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Cloud Infrastructure Management</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">BlockMint Node Manager</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
              ©
            </span>
          </div>
        </motion.footer>
      </main>

      {/* Safe Mode Bottom Navigation */}
      <SafeBottomNav />
    </div>
    </SafeAppLockProvider>
  );
}

export default SafeModeApp;

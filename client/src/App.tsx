import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ComplianceProvider, useCompliance } from "@/contexts/ComplianceContext";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Switch, Route, Link, useLocation } from "wouter";
import { useKeyboardAdjustment } from "@/hooks/useKeyboardAdjustment";

import { BottomNav, type TabType } from "@/components/BottomNav";
import { SafeBottomNav } from "@/components/SafeBottomNav";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SafeHeader } from "@/components/SafeHeader";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { DashboardSkeleton, WalletSkeleton } from "@/components/LoadingSkeleton";
import { ForceUpdateModal } from "@/components/ForceUpdateModal";
import { TwoFactorVerifyScreen } from "@/components/TwoFactorVerifyScreen";
import { AppLockProvider } from "@/components/AppLock";
import { SiX, SiInstagram } from "react-icons/si";
import { useMiningData } from "@/hooks/useMiningData";
import { onAuthChange, logOut } from "@/lib/firebase";
import type { User } from "firebase/auth";

// Lazy load heavy pages for faster initial load
const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Wallet = lazy(() => import("@/pages/Wallet").then(m => ({ default: m.Wallet })));
const Invest = lazy(() => import("@/pages/Invest").then(m => ({ default: m.Invest })));
const SoloMining = lazy(() => import("@/pages/SoloMining").then(m => ({ default: m.SoloMining })));
const Mining = lazy(() => import("@/pages/Mining").then(m => ({ default: m.Mining })));
const Settings = lazy(() => import("@/pages/Settings").then(m => ({ default: m.Settings })));
const Onboarding = lazy(() => import("@/pages/Onboarding").then(m => ({ default: m.Onboarding })));
const AuthPage = lazy(() => import("@/pages/AuthPage").then(m => ({ default: m.AuthPage })));
const AuthRedirect = lazy(() => import("@/pages/AuthRedirect").then(m => ({ default: m.AuthRedirect })));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import("@/pages/TermsOfService").then(m => ({ default: m.TermsOfService })));
const Referral = lazy(() => import("@/pages/Referral").then(m => ({ default: m.Referral })));
const History = lazy(() => import("@/pages/History").then(m => ({ default: m.History })));
const VirtualCard = lazy(() => import("@/pages/VirtualCard").then(m => ({ default: m.VirtualCard })));
const DatabaseAdmin = lazy(() => import("@/pages/DatabaseAdmin").then(m => ({ default: m.DatabaseAdmin })));
const ArticlePage = lazy(() => import("@/pages/ArticlePage").then(m => ({ default: m.ArticlePage })));
const News = lazy(() => import("@/pages/News").then(m => ({ default: m.News })));
const Support = lazy(() => import("@/pages/Support"));
const GrowthHub = lazy(() => import("@/pages/GrowthHub").then(m => ({ default: m.GrowthHub })));
const StarterMiner = lazy(() => import("@/pages/StarterMiner").then(m => ({ default: m.StarterMiner })));
const Founders = lazy(() => import("@/pages/Founders").then(m => ({ default: m.Founders })));
const Ambassador = lazy(() => import("@/pages/Ambassador").then(m => ({ default: m.Ambassador })));
const Transparency = lazy(() => import("@/pages/Transparency").then(m => ({ default: m.Transparency })));
const HowItWorks = lazy(() => import("@/pages/HowItWorks").then(m => ({ default: m.HowItWorks })));
const ReferralTerms = lazy(() => import("@/pages/ReferralTerms").then(m => ({ default: m.ReferralTerms })));
const ReferralLanding = lazy(() => import("@/pages/ReferralLanding").then(m => ({ default: m.ReferralLanding })));

// Safe Mode pages and app shell (compliance mode for mobile app)
const SafeHome = lazy(() => import("@/pages/SafeHome").then(m => ({ default: m.SafeHome })));
const SafeMetrics = lazy(() => import("@/pages/SafeMetrics").then(m => ({ default: m.SafeMetrics })));
const SafeSettings = lazy(() => import("@/pages/SafeSettings").then(m => ({ default: m.SafeSettings })));
const SafeModeApp = lazy(() => import("@/components/SafeModeApp").then(m => ({ default: m.SafeModeApp })));
const SafeTermsOfService = lazy(() => import("@/pages/SafeTermsOfService").then(m => ({ default: m.SafeTermsOfService })));
const SafePrivacyPolicy = lazy(() => import("@/pages/SafePrivacyPolicy").then(m => ({ default: m.SafePrivacyPolicy })));
const SafeNewsArticle = lazy(() => import("@/pages/SafeNewsArticle").then(m => ({ default: m.SafeNewsArticle })));

// Web Storefront (compliance mode for web browser - allows signup, USDT deposit)
const WebStorefrontApp = lazy(() => import("@/components/WebStorefrontApp").then(m => ({ default: m.WebStorefrontApp })));

type AppView = "onboarding" | "auth" | "main";
type AuthMode = "signin" | "register";
type SafeTabType = "home" | "metrics" | "news" | "settings";

// Simple loading fallback for lazy components
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function MobileApp() {
  const [activeTab, setActiveTabState] = useState<TabType>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [appView, setAppView] = useState<AppView>("onboarding");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pending2FA, setPending2FA] = useState(false);
  
  // Wrap tab change to always scroll to top on navigation
  const setActiveTab = (tab: TabType) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveTabState(tab);
  };
  
  // Apply keyboard adjustment globally for all input fields
  useKeyboardAdjustment();
  
  const {
    miningStats,
    balances,
    transactions,
    pools,
    settings,
    chartData,
    portfolioHistory,
    contracts,
    poolStatus,
    totalBalance,
    change24h,
    isPending,
    isLoading,
    isFetching,
    refetchBalances,
    toggleMining,
    selectPool,
    updateSettings,
  } = useMiningData();

  // Handle hardware back button (iOS swipe gesture / Android back button)
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // If settings is open, close it
      if (showSettings) {
        setShowSettings(false);
        return;
      }
      
      // If on non-home tab, go back to home tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }
      
      // Otherwise, use browser history or minimize app
      if (canGoBack) {
        window.history.back();
      } else {
        // On home tab with no history, minimize app (don't exit)
        CapacitorApp.minimizeApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [showSettings, activeTab]);

  useEffect(() => {
    // Version check to reset localStorage on new app version
    const currentVersion = "1.8.0";
    const savedVersion = localStorage.getItem("appVersion");
    
    if (savedVersion !== currentVersion) {
      // Only clear version-related items, not all localStorage
      localStorage.setItem("appVersion", currentVersion);
    }

    // Capture ?ref= referral code from URL and persist to localStorage
    const urlRef = new URLSearchParams(window.location.search).get("ref");
    if (urlRef) {
      localStorage.setItem("ref", urlRef);
    }
    
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
          // User signed out remotely - clear state and go to auth
          setAppView("auth");
        }
      }
    });
    return () => unsubscribe();
  }, [appView]);

  // Sync Firebase user into backend + localStorage so deposits/admin see the user immediately
  useEffect(() => {
    const syncUser = async () => {
      if (!firebaseUser) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        console.log("Syncing user with backend:", firebaseUser.email);
        // Pick up referral code from localStorage (set by ReferralLanding or ?ref= param)
        const refCode = localStorage.getItem("ref") || undefined;
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(refCode ? { referralCode: refCode } : {}),
        });
        
        if (!res.ok) {
          const error = await res.json();
          console.error("Auth sync failed:", error);
          // Show the actual error to help debugging
          alert(`Auth sync failed: ${error.error || 'Unknown error'}. Please contact support.`);
          throw new Error("Failed to sync user");
        }
        const data = await res.json();
        console.log("Auth sync success:", data.user);
        const storedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          id: data.user?.id,
          dbId: data.user?.id,
          role: data.user?.role,
        };
        localStorage.setItem("user", JSON.stringify(storedUser));
        console.log("User stored in localStorage:", storedUser);

        // Only check 2FA if user is actively logging in (coming from auth view)
        // Don't prompt for 2FA on app reload when already logged in
        if (appView === "auth") {
          try {
            const twoFARes = await fetch(`/api/auth/2fa/status/${firebaseUser.uid}`);
            if (twoFARes.ok) {
              const twoFAData = await twoFARes.json();
              if (twoFAData.enabled) {
                setRequires2FA(true);
                setPending2FA(true);
                // Don't move to main view yet - wait for 2FA verification
                return;
              }
            }
          } catch (error) {
            console.error("Failed to check 2FA status:", error);
          }
          // No 2FA enabled, go to main
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
    // Skip onboarding screens but go to auth page (not main app)
    setAppView("auth");
  };

  if (appView === "onboarding") {
    return (
      <div className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Onboarding onComplete={handleOnboardingComplete} onSignIn={handleSignIn} onSkip={handleSkipOnboarding} />
        </Suspense>
      </div>
    );
  }

  if (appView === "auth") {
    return (
      <div className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <AuthPage 
            mode={authMode}
            onBack={() => setAppView("onboarding")}
            onModeChange={setAuthMode}
            onComplete={handleAuthComplete}
          />
        </Suspense>
      </div>
    );
  }

  // Show full-page 2FA verification screen before any app content
  if (pending2FA && firebaseUser) {
    return (
      <TwoFactorVerifyScreen
        userId={firebaseUser.uid}
        onSuccess={() => {
          setPending2FA(false);
          setAppView("main");
        }}
        onBack={() => {
          // Allow user to go back and sign out
          logOut();
          setPending2FA(false);
          setRequires2FA(false);
          setAppView("auth");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden safe-area-inset" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 22px)' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />

        {/* Force Update Modal */}
        <ForceUpdateModal />
      </div>

      {/* Global Header - only renders on home tab */}
      <GlobalHeader
        activeTab={activeTab}
        onOpenSettings={() => setShowSettings(true)}
        onNavigateToHome={() => setActiveTab("home")}
        onNavigateToWallet={() => setActiveTab("wallet")}
        onNavigateToInvest={() => setActiveTab("invest")}
      />

      <main className="relative z-10 max-w-md mx-auto px-4 pb-28">
        <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            isLoading ? (
              <DashboardSkeleton key="dashboard-skeleton" />
            ) : (
              <Dashboard
                key="dashboard"
                balances={balances}
                totalBalance={totalBalance}
                change24h={change24h}
                transactions={transactions}
                miningStats={miningStats}
                activeContracts={0}
                portfolioHistory={portfolioHistory}
                onOpenSettings={() => setShowSettings(true)}
                onOpenProfile={() => firebaseUser ? setShowSettings(true) : setAppView("auth")}
                onNavigateToInvest={() => setActiveTab("invest")}
                onNavigateToSolo={() => setActiveTab("solo")}
                onNavigateToMining={() => setActiveTab("mining")}
                onNavigateToWallet={() => setActiveTab("wallet")}
                onNavigateToHome={() => setActiveTab("home")}
                onWithdraw={() => setActiveTab("wallet")}
                isLoggedIn={localStorage.getItem("isLoggedIn") === "true"}
                onRefreshBalances={refetchBalances}
                isFetching={isFetching}
              />
            )
          )}
          {activeTab === "wallet" && (
            isLoading ? (
              <WalletSkeleton key="wallet-skeleton" />
            ) : (
              <Wallet
                key="wallet"
                balances={balances}
                transactions={transactions}
                totalBalance={totalBalance}
                change24h={change24h}
                onNavigateToHome={() => setActiveTab("home")}
                onNavigateToWallet={() => setActiveTab("wallet")}
                onNavigateToInvest={() => setActiveTab("invest")}
                onOpenSettings={() => setShowSettings(true)}
              />
            )
          )}
          {activeTab === "invest" && (
            <Invest 
              key="invest" 
              onNavigateToHome={() => setActiveTab("home")}
              onNavigateToWallet={() => setActiveTab("wallet")}
              onNavigateToInvest={() => setActiveTab("invest")}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}
          {activeTab === "solo" && (
            <SoloMining key="solo" />
          )}
          {activeTab === "mining" && (
            <Mining
              key="mining"
              chartData={chartData}
              contracts={contracts}
              poolStatus={poolStatus}
              onNavigateToInvest={() => setActiveTab("invest")}
            />
          )}
        </AnimatePresence>
        </Suspense>

        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center space-y-4 pb-safe"
        >
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 rounded-full blur-xl"></div>
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
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://x.com/BlockMintingApp"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate transition-transform active:scale-95"
              data-testid="link-social-x"
              onClick={(e) => {
                e.preventDefault();
                // Try to open in Twitter app first, fallback to browser
                window.location.href = 'twitter://user?screen_name=BlockMintingApp';
                setTimeout(() => {
                  window.location.href = 'https://x.com/BlockMintingApp';
                }, 500);
              }}
            >
              <SiX className="w-5 h-5 text-foreground" />
            </a>
            <a
              href="https://www.instagram.com/blockmint.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate transition-transform active:scale-95"
              data-testid="link-social-instagram"
              onClick={(e) => {
                e.preventDefault();
                // Try to open in Instagram app first, fallback to browser
                window.location.href = 'instagram://user?username=blockmint.app';
                setTimeout(() => {
                  window.location.href = 'https://www.instagram.com/blockmint.app/';
                }, 500);
              }}
            >
              <SiInstagram className="w-5 h-5 text-foreground" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">Cryptocurrency Payments Accepted</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">BlockMint App By BlockMint Mining</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
              ©
            </span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href="/terms" data-testid="link-terms-of-service">
              <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Terms of Service
              </span>
            </Link>
            <Link href="/privacy" data-testid="link-privacy-policy">
              <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </Link>
          </div>
        </motion.footer>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-background safe-area-inset"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
              <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px]" />
            </div>
            {/* Scroll-aware background for system status bar */}
            <ScrollAwareStatusBar />
            {/* Spacer for system status bar - reduced spacing */}
            <div className="h-[env(safe-area-inset-top,0px)]" />
            <div className="relative z-10 flex-1 overflow-auto px-4 pb-8">
              <Settings
                settings={settings}
                onSettingsChange={updateSettings}
                user={firebaseUser}
                onClose={() => setShowSettings(false)}
                onLogout={async () => {
                  await logOut();
                  localStorage.clear(); // Clear all local storage including onboarding flag
                  setShowSettings(false);
                  setAppView("onboarding"); // Return to splash screens
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppRouter() {
  const { isComplianceMode, isWebStorefront, isLoading } = useCompliance();
  
  // Wait for compliance mode to be determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  
  // WEB CONSOLE - Only shown when user navigates to /console routes
  // This is the production-safe web platform with signup and USDT deposit
  if (isWebStorefront) {
    return (
      <Switch>
        <Route path="/legal/privacy" component={SafePrivacyPolicy} />
        <Route path="/legal/terms" component={SafeTermsOfService} />
        <Route path="/console/:rest*" component={WebStorefrontApp} />
        <Route path="/console" component={WebStorefrontApp} />
        <Route component={WebStorefrontApp} />
      </Switch>
    );
  }
  
  // SAFE MODE - Review-safe version shown on main page when compliance is ON
  // This is what the App Store reviewer sees (no crypto, no signup)
  if (isComplianceMode) {
    return (
      <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/auth-redirect" component={AuthRedirect} />
        <Route path="/legal/privacy" component={SafePrivacyPolicy} />
        <Route path="/legal/terms" component={SafeTermsOfService} />
        <Route path="/privacy" component={SafePrivacyPolicy} />
        <Route path="/terms" component={SafeTermsOfService} />
        <Route path="/safe-news/:id" component={SafeNewsArticle} />
        <Route path="/support" component={Support} />
        <Route path="/db-admin" component={DatabaseAdmin} />
        <Route path="/console/:rest*" component={WebStorefrontApp} />
        <Route path="/console" component={WebStorefrontApp} />
        <Route path="/" component={SafeModeApp} />
        <Route component={SafeModeApp} />
      </Switch>
      </Suspense>
    );
  }
  
  // NORMAL MODE - Full crypto mining app (compliance OFF)
  return (
    <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path="/auth-redirect" component={AuthRedirect} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/referral">
        {() => <Referral />}
      </Route>
      <Route path="/db-admin" component={DatabaseAdmin} />
      <Route path="/article/:id" component={ArticlePage} />
      <Route path="/support" component={Support} />
      <Route path="/virtual-card">
        {() => <VirtualCard onBack={() => window.history.back()} />}
      </Route>
      <Route path="/history">
        {() => <History />}
      </Route>
      <Route path="/r/:code" component={ReferralLanding} />
      <Route path="/growth/starter">
        {() => <StarterMiner onBack={() => window.history.back()} />}
      </Route>
      <Route path="/growth">
        {() => <GrowthHub onBack={() => window.history.back()} />}
      </Route>
      <Route path="/founders">
        {() => <Founders onBack={() => window.history.back()} />}
      </Route>
      <Route path="/ambassador">
        {() => <Ambassador onBack={() => window.history.back()} />}
      </Route>
      <Route path="/transparency">
        {() => <Transparency onBack={() => window.history.back()} />}
      </Route>
      <Route path="/how-it-works">
        {() => <HowItWorks onBack={() => window.history.back()} />}
      </Route>
      <Route path="/referral-terms">
        {() => <ReferralTerms onBack={() => window.history.back()} />}
      </Route>
      <Route path="/" component={MobileApp} />
      <Route component={MobileApp} />
    </Switch>
    </Suspense>
  );
}

function App() {
  // Get user ID from localStorage for AppLock
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserId(parsed.id || parsed.dbId || parsed.uid);
      } catch (e) {
        console.error("Failed to parse user from localStorage");
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyProvider>
          <NotificationProvider>
            <ComplianceProvider>
              <TooltipProvider>
                <AppLockProvider userId={userId}>
                  <Toaster />
                  <AppRouter />
                </AppLockProvider>
              </TooltipProvider>
            </ComplianceProvider>
          </NotificationProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

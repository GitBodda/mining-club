import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Switch, Route, Link } from "wouter";

import { BottomNav, type TabType } from "@/components/BottomNav";
import { IOSStatusBar, IOSHomeIndicator } from "@/components/IOSStatusBar";
import { Dashboard } from "@/pages/Dashboard";
import { Wallet } from "@/pages/Wallet";
import { Invest } from "@/pages/Invest";
import { SoloMining } from "@/pages/SoloMining";
import { Mining } from "@/pages/Mining";
import { Settings } from "@/pages/Settings";
import { Onboarding } from "@/pages/Onboarding";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardSkeleton, WalletSkeleton } from "@/components/LoadingSkeleton";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { useMiningData } from "@/hooks/useMiningData";
import { onAuthChange, logOut } from "@/lib/firebase";
import type { User } from "firebase/auth";

type AppView = "onboarding" | "auth" | "main";
type AuthMode = "signin" | "register";

function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [appView, setAppView] = useState<AppView>("onboarding");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  
  const {
    miningStats,
    balances,
    transactions,
    pools,
    settings,
    chartData,
    totalBalance,
    change24h,
    isPending,
    isLoading,
    toggleMining,
    selectPool,
    updateSettings,
  } = useMiningData();

  useEffect(() => {
    // Version check to reset localStorage on new app version
    const currentVersion = "1.0.0";
    const savedVersion = localStorage.getItem("appVersion");
    
    if (savedVersion !== currentVersion) {
      localStorage.clear();
      localStorage.setItem("appVersion", currentVersion);
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
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user);
      if (user) {
        localStorage.setItem("isLoggedIn", "true");
      } else if (appView === "main") {
        // User signed out remotely - clear state and go to auth
        localStorage.removeItem("isLoggedIn");
        setAppView("auth");
      }
    });
    return () => unsubscribe();
  }, [appView]);

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

  const handleSkipToMain = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    localStorage.setItem("isLoggedIn", "true");
    setAppView("main");
  };

  if (appView === "onboarding") {
    return (
      <>
        <IOSStatusBar />
        <Onboarding onComplete={handleOnboardingComplete} onSignIn={handleSignIn} onSkip={handleSkipToMain} />
        <IOSHomeIndicator />
      </>
    );
  }

  if (appView === "auth") {
    return (
      <>
        <IOSStatusBar />
        <AuthPage 
          mode={authMode}
          onBack={() => setAppView("onboarding")}
          onModeChange={setAuthMode}
          onComplete={handleAuthComplete}
        />
        <IOSHomeIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <IOSStatusBar />
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-md mx-auto px-4 pt-16 pb-48">
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
                onOpenSettings={() => setShowSettings(true)}
                onOpenProfile={() => firebaseUser ? setShowSettings(true) : setAppView("auth")}
                onNavigateToInvest={() => setActiveTab("invest")}
                onNavigateToSolo={() => setActiveTab("solo")}
                isLoggedIn={localStorage.getItem("isLoggedIn") === "true"}
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
              />
            )
          )}
          {activeTab === "invest" && (
            <Invest key="invest" />
          )}
          {activeTab === "solo" && (
            <SoloMining key="solo" />
          )}
          {activeTab === "mining" && (
            <Mining
              key="mining"
              chartData={chartData}
              onNavigateToInvest={() => setActiveTab("invest")}
            />
          )}
        </AnimatePresence>

        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center space-y-2"
        >
          <p className="text-xs text-muted-foreground">Cryptocurrency Payments Accepted</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">Mining Club App By Hardisk UAE Mining Farms</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
              ©
            </span>
          </div>
          <Link href="/privacy" data-testid="link-privacy-policy">
            <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Privacy Policy
            </span>
          </Link>
        </motion.footer>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <IOSHomeIndicator />

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-background"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <IOSStatusBar />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
              <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10 flex items-center justify-between px-4 pt-16 pb-4">
              <h1 className="text-xl font-bold text-foreground font-display">Mining Club</h1>
              <motion.button
                data-testid="button-close-settings"
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>
            <div className="relative z-10 flex-1 overflow-auto px-4 pb-8">
              <Settings
                settings={settings}
                onSettingsChange={updateSettings}
                user={firebaseUser}
                onLogout={async () => {
                  await logOut();
                  localStorage.removeItem("isLoggedIn");
                  setShowSettings(false);
                  setAppView("auth");
                }}
              />
            </div>
            <IOSHomeIndicator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/" component={MobileApp} />
            <Route component={MobileApp} />
          </Switch>
        </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;

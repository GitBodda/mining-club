import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Switch, Route, Link } from "wouter";

import { BottomNav, type TabType } from "@/components/BottomNav";
import { GlobalHeader } from "@/components/GlobalHeader";
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
import Exchange from "@/pages/Exchange";
import { Referral } from "@/pages/Referral";
import { History } from "@/pages/History";
import { VirtualCard } from "@/pages/VirtualCard";
import { SiX, SiInstagram } from "react-icons/si";
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

  useEffect(() => {
    // Version check to reset localStorage on new app version
    const currentVersion = "1.0.1";
    const savedVersion = localStorage.getItem("appVersion");
    
    if (savedVersion !== currentVersion) {
      // Only clear version-related items, not all localStorage
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
    const unsubscribe = onAuthChange(async (user) => {
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
      <div className="min-h-screen">
        <Onboarding onComplete={handleOnboardingComplete} onSignIn={handleSignIn} onSkip={handleSkipToMain} />
      </div>
    );
  }

  if (appView === "auth") {
    return (
      <div className="min-h-screen">
        <AuthPage 
          mode={authMode}
          onBack={() => setAppView("onboarding")}
          onModeChange={setAuthMode}
          onComplete={handleAuthComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden safe-area-inset">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Global Header - persists across all tabs */}
      <GlobalHeader
        onOpenSettings={() => setShowSettings(true)}
        onNavigateToHome={() => setActiveTab("home")}
        onNavigateToWallet={() => setActiveTab("wallet")}
        onNavigateToInvest={() => setActiveTab("invest")}
      />

      <main className="relative z-10 max-w-md mx-auto px-4 pt-[10px] pb-48">
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
              href="https://x.com/BlockMintApp"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate transition-transform active:scale-95"
              data-testid="link-social-x"
              onClick={(e) => {
                e.preventDefault();
                // Try to open in Twitter app first, fallback to browser
                window.location.href = 'twitter://user?screen_name=BlockMintApp';
                setTimeout(() => {
                  window.location.href = 'https://x.com/BlockMintApp';
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
            <span className="text-xs text-muted-foreground">BlockMint App By Hardisk UAE Mining Farms</span>
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
            <div className="relative z-10 flex items-center justify-between px-4 pt-safe pb-4">
              <h1 className="text-xl font-bold text-foreground font-display">BlockMint</h1>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Switch>
                <Route path="/privacy" component={PrivacyPolicy} />
                <Route path="/exchange" component={Exchange} />
                <Route path="/referral" component={Referral} />
                <Route path="/virtual-card">
                  {() => <VirtualCard onBack={() => window.history.back()} />}
                </Route>
                <Route path="/history">
                  {() => <History />}
                </Route>
                <Route path="/" component={MobileApp} />
                <Route component={MobileApp} />
              </Switch>
            </TooltipProvider>
          </NotificationProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

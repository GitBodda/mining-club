import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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
import { useMiningData } from "@/hooks/useMiningData";

type AppView = "onboarding" | "auth" | "main";
type AuthMode = "signin" | "register";

function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [appView, setAppView] = useState<AppView>("onboarding");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  
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
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (hasSeenOnboarding && isLoggedIn) {
      setAppView("main");
    } else if (hasSeenOnboarding) {
      setAppView("auth");
    }
  }, []);

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
    <div className="min-h-screen bg-background">
      <IOSStatusBar />
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-md mx-auto px-4 pt-16 pb-28">
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
              <h1 className="text-xl font-bold text-foreground font-display">Settings</h1>
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
      <TooltipProvider>
        <Toaster />
        <MobileApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

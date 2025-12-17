import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

import { BottomNav, type TabType } from "@/components/BottomNav";
import { Dashboard } from "@/pages/Dashboard";
import { Wallet } from "@/pages/Wallet";
import { Mining } from "@/pages/Mining";
import { Settings } from "@/pages/Settings";
import { DashboardSkeleton, WalletSkeleton } from "@/components/LoadingSkeleton";
import { useMiningData } from "@/hooks/useMiningData";

function MobileApp() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-md mx-auto px-4 pt-12 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            isLoading ? (
              <DashboardSkeleton key="dashboard-skeleton" />
            ) : (
              <Dashboard
                key="dashboard"
                miningStats={miningStats}
                chartData={chartData}
                onToggleMining={toggleMining}
                isPending={isPending}
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
          {activeTab === "mining" && (
            <Mining
              key="mining"
              pools={pools}
              settings={settings}
              chartData={chartData}
              onPoolSelect={selectPool}
              onSettingsChange={updateSettings}
            />
          )}
          {activeTab === "settings" && (
            <Settings
              key="settings"
              settings={settings}
              onSettingsChange={updateSettings}
            />
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
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

/**
 * Dashboard — Minimal Version (Balance Card + Action Cards)
 *
 * Full homepage backup: client/src/pages/Dashboard.backup.tsx
 * To restore: cp client/src/pages/Dashboard.backup.tsx client/src/pages/Dashboard.tsx
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Zap, Sparkles, Fan, CreditCard, Bitcoin,
  Cpu, History, MessageSquare, X, Calculator,
  TrendingUp, BarChart3, ChevronRight,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { LiquidGlassCard } from "@/components/GlassCard";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { WalletBalance, Transaction, MiningStats } from "@/lib/types";

interface DashboardProps {
  balances: WalletBalance[];
  totalBalance: number;
  change24h: number;
  transactions?: Transaction[];
  miningStats?: MiningStats;
  activeContracts?: number;
  portfolioHistory?: Array<{ day: string; value: number; timestamp: string }>;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onNavigateToInvest?: () => void;
  onNavigateToSolo?: () => void;
  onNavigateToMining?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToHome?: () => void;
  isLoggedIn?: boolean;
  onRefreshBalances?: () => void;
  isFetching?: boolean;
}

// ─── ROI Calculator Popup ───────────────────────────────────────────────────

const BASE_PRICE = 14; // $14/TH base (1 TH/s)
const getPricePerTH = (th: number) => {
  if (th >= 1000) return 11;
  if (th >= 500)  return 11.5;
  if (th >= 100)  return 12;
  if (th >= 50)   return 12.5;
  if (th >= 30)   return 13;
  if (th >= 10)   return 13.5;
  if (th >= 5)    return 13.75;
  return 14;
};

function ROICalculator({ onClose, onCreateMiner }: { onClose: () => void; onCreateMiner: (amount: number) => void }) {
  const { convert, getSymbol } = useCurrency();
  const { btcPrice } = useBTCPrice();
  const [hashrate, setHashrate] = useState(50);   // TH/s
  const [desiredBTCPrice, setDesiredBTCPrice] = useState(btcPrice || 85000);
  const [customHashInput, setCustomHashInput] = useState("50");
  const [customBTCInput, setCustomBTCInput] = useState(String(Math.round(btcPrice || 85000)));

  // Keep desiredBTCPrice in sync with live price if user hasn't changed it
  const [userSetBTC, setUserSetBTC] = useState(false);
  useEffect(() => {
    if (!userSetBTC && btcPrice) {
      setDesiredBTCPrice(btcPrice);
      setCustomBTCInput(String(Math.round(btcPrice)));
    }
  }, [btcPrice, userSetBTC]);

  const pricePerTH = getPricePerTH(hashrate);
  const investment = hashrate * pricePerTH;
  // BTC mined daily is fixed — based on 0.5% daily return valued at CURRENT BTC price
  const currentPrice = btcPrice || 85000;
  const dailyBTC = currentPrice > 0 ? (investment * 0.005) / currentPrice : 0;
  const monthlyBTC = dailyBTC * 30;
  const annualBTC = dailyBTC * 365;
  // USD value of BTC earnings at DESIRED BTC price (increases as desired price rises)
  const dailyUSD = dailyBTC * desiredBTCPrice;
  const monthlyUSD = dailyUSD * 30;
  const annualUSD = dailyUSD * 365;
  // Payback ratio: annual return as % of investment
  const paybackRatio = investment > 0 ? (annualUSD / investment) * 100 : 0;

  const setHashrateSynced = (v: number) => {
    const clamped = Math.max(1, Math.min(1000, v));
    setHashrate(clamped);
    setCustomHashInput(String(clamped));
  };
  const setBTCSynced = (v: number) => {
    const clamped = Math.max(1000, Math.min(500000, v));
    setDesiredBTCPrice(clamped);
    setCustomBTCInput(String(clamped));
    setUserSetBTC(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md bg-background/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-3 border-b border-white/[0.07]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-teal-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">ROI Calculator</h2>
                <p className="text-[10px] text-muted-foreground">Estimate your mining returns</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* BTC Price row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <div>
              <p className="text-[10px] text-muted-foreground font-ui">Current BTC Price</p>
              <p className="text-base font-bold text-amber-400 font-numbers">${btcPrice ? btcPrice.toLocaleString() : "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground mb-1">BTC predicted $250K by 2028</p>
              <button
                onClick={() => setBTCSynced(250000)}
                className="text-[10px] font-bold text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2.5 py-1 rounded-full transition-colors"
              >
                Use $250K →
              </button>
            </div>
          </div>

          {/* Hash Power slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Hash Power</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full font-numbers">{hashrate} TH/s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                <button onClick={() => setHashrateSynced(hashrate - 1)} className="w-8 h-7 flex items-center justify-center text-foreground/80 bg-white/[0.06] hover:bg-white/10 transition-colors text-sm font-bold">−</button>
                <div className="w-px h-5 self-center bg-white/20" />
                <button onClick={() => setHashrateSynced(hashrate + 1)} className="w-8 h-7 flex items-center justify-center text-foreground/80 bg-white/[0.06] hover:bg-white/10 transition-colors text-sm font-bold">+</button>
              </div>
              <div className="flex-1">
                <Slider value={[hashrate]} onValueChange={(v) => setHashrateSynced(v[0])} min={1} max={1000} step={1} className="py-0" />
              </div>
              <input
                type="number"
                value={customHashInput}
                onChange={(e) => setCustomHashInput(e.target.value)}
                onBlur={() => { const p = parseInt(customHashInput); if (!isNaN(p)) setHashrateSynced(p); else setCustomHashInput(String(hashrate)); }}
                onKeyDown={(e) => { if (e.key === "Enter") { const p = parseInt(customHashInput); if (!isNaN(p)) setHashrateSynced(p); } }}
                className="w-14 h-7 px-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-foreground text-center focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-[68px] pr-[60px]">
              <span>1 TH/s</span><span>1,000 TH/s</span>
            </div>
          </div>

          {/* Investment amount (linked) */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
            <div>
              <p className="text-[9px] text-muted-foreground font-ui">Investment Amount</p>
              <p className="text-base font-bold text-foreground font-numbers">{getSymbol()}{convert(investment).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground">Price / TH/s</p>
              <p className="text-xs font-bold text-blue-400">{getSymbol()}{pricePerTH.toFixed(2)}</p>
            </div>
          </div>

          {/* Desired BTC Price slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Desired BTC Price</label>
              <span className="text-xs font-bold text-emerald-400 font-numbers">${desiredBTCPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 rounded-full overflow-hidden border border-white/10 shrink-0">
                <button onClick={() => setBTCSynced(desiredBTCPrice - 1000)} className="w-8 h-7 flex items-center justify-center text-foreground/80 bg-white/[0.06] hover:bg-white/10 transition-colors text-sm font-bold">−</button>
                <div className="w-px h-5 self-center bg-white/20" />
                <button onClick={() => setBTCSynced(desiredBTCPrice + 1000)} className="w-8 h-7 flex items-center justify-center text-foreground/80 bg-white/[0.06] hover:bg-white/10 transition-colors text-sm font-bold">+</button>
              </div>
              <div className="flex-1">
                <Slider value={[desiredBTCPrice]} onValueChange={(v) => setBTCSynced(v[0])} min={1000} max={500000} step={1000} className="py-0" />
              </div>
              <input
                type="number"
                value={customBTCInput}
                onChange={(e) => setCustomBTCInput(e.target.value)}
                onBlur={() => { const p = parseInt(customBTCInput); if (!isNaN(p)) setBTCSynced(p); else setCustomBTCInput(String(desiredBTCPrice)); }}
                onKeyDown={(e) => { if (e.key === "Enter") { const p = parseInt(customBTCInput); if (!isNaN(p)) setBTCSynced(p); } }}
                className="w-16 h-7 px-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-foreground text-center focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-[68px] pr-[68px]">
              <span>$1K</span><span>$500K</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">Projected Returns</span>
            </div>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Daily", usd: dailyUSD, btc: dailyBTC },
              { label: "Monthly", usd: monthlyUSD, btc: monthlyBTC },
              { label: "Annually", usd: annualUSD, btc: annualBTC },
            ].map(({ label, usd, btc }) => (
              <div key={label} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-center">
                <p className="text-[9px] text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-bold text-emerald-400 font-numbers">{getSymbol()}{convert(usd).toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground font-numbers">₿{btc.toFixed(6)}</p>
              </div>
            ))}
          </div>

          {/* Payback ratio */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Annual Payback Ratio</span>
            </div>
            <p className="text-sm font-bold text-purple-400 font-numbers">{(paybackRatio / 3).toFixed(1)}%</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onCreateMiner(investment); onClose(); }}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] relative overflow-hidden"
          >
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
            <Fan className="w-4 h-4" />
            Buy this Miner ({hashrate} TH/s)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard({
  balances = [],
  totalBalance = 0,
  onNavigateToMining,
  onNavigateToWallet,
}: DashboardProps) {
  const { convert, getSymbol } = useCurrency();
  const { prices: cryptoPrices } = useCryptoPrices();
  const [, setLocation] = useLocation();

  const [prevBalance, setPrevBalance] = useState(totalBalance);
  const [balanceIncreased, setBalanceIncreased] = useState(false);
  const [showROI, setShowROI] = useState(false);

  useEffect(() => {
    if (totalBalance > prevBalance && prevBalance > 0) {
      setBalanceIncreased(true);
      const timer = setTimeout(() => setBalanceIncreased(false), 1500);
      return () => clearTimeout(timer);
    }
    setPrevBalance(totalBalance);
  }, [totalBalance, prevBalance]);

  const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.dbId || user?.id || user?.uid;

  const { data: miningPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/users", userId, "mining-purchases"],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/users/${userId}/mining-purchases`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const activeMiningPurchases = (miningPurchases || []).filter((p: any) => p?.status === "active");

  const { data: estimateConfig } = useQuery<{ miningEstimateMultiplier: number }>({
    queryKey: ["/api/config/estimates"],
    queryFn: async () => {
      const res = await fetch("/api/config/estimates");
      if (!res.ok) return { miningEstimateMultiplier: 1 };
      return res.json();
    },
    staleTime: 60000,
  });

  const miningPerSecondUSDBase = activeMiningPurchases.reduce((sum: number, p: any) => {
    const investment = Number(p?.amount) || 0;
    return sum + (investment * 0.005) / 86400;
  }, 0);
  const miningEstimateMultiplier = Number(estimateConfig?.miningEstimateMultiplier) || 1;
  const miningPerSecondUSD = miningPerSecondUSDBase * miningEstimateMultiplier;

  const secondsSinceMidnight = (() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((Date.now() - midnight.getTime()) / 1000));
  })();
  const miningEstimatedTodayUSD = miningPerSecondUSD * secondsSinceMidnight;

  const { data: pendingDeposits } = useQuery({
    queryKey: ["pending-deposits", userId],
    queryFn: async () => {
      if (!userId) return { requests: [], totals: {} };
      const res = await fetch(`/api/deposits/pending/${userId}`);
      if (!res.ok) return { requests: [], totals: {} };
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const pendingTotal = Object.entries(pendingDeposits?.totals || {}).reduce((sum, [currency, amount]) => {
    const price = cryptoPrices[currency as keyof typeof cryptoPrices]?.price ?? 0;
    return sum + (amount as number) * price;
  }, 0);

  const calculateTotalHashrateTH = () => {
    if (!activeMiningPurchases.length) return 0;
    return activeMiningPurchases
      .filter((p: any) => !String(p?.packageName || "").includes("Solo Mining"))
      .reduce((acc: number, p: any) => {
        let val = Number(p.hashrate) || 0;
        const unit = (p.hashrateUnit || "TH/s").toUpperCase();
        if (unit.includes("MH")) val = val / 1000000;
        else if (unit.includes("GH")) val = val / 1000;
        else if (unit.includes("PH")) val = val * 1000;
        else if (unit.includes("EH")) val = val * 1000000;
        return acc + val;
      }, 0);
  };

  const totalHashrateTH = calculateTotalHashrateTH();
  const formatHashrate = (th: number) => {
    if (th === 0) return "0 TH/s";
    if (th >= 1000) return `${(th / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K TH/s`;
    if (th < 0.000001) return `${(th * 1000000).toFixed(0)} MH/s`;
    if (th < 0.001) return `${(th * 1000).toFixed(0)} GH/s`;
    return `${Number(th.toFixed(2))} TH/s`;
  };
  const miningPower = formatHashrate(totalHashrateTH);
  const convertedBalance = convert(totalBalance);

  const handleDepositCard = () => {
    localStorage.setItem("openDepositMethod", "card");
    onNavigateToWallet?.();
  };
  const handleDepositCrypto = () => {
    localStorage.setItem("openDepositMethod", "crypto");
    onNavigateToWallet?.();
  };
  const handleMyMiners = () => {
    localStorage.setItem("scrollToMyDevices", "true");
    onNavigateToMining?.();
  };
  const handleHistory = () => {
    localStorage.setItem("scrollToRecentActivity", "true");
    onNavigateToWallet?.();
  };
  const handleROICreateMiner = (_amount: number) => {
    onNavigateToMining?.();
  };

  const cardShineVariants = {
    animate: { x: ["-100%", "200%"], transition: { duration: 3, repeat: Infinity, repeatDelay: 2 } }
  };

  return (
    <>
      <motion.div
        className="flex flex-col gap-4 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Balance Card */}
        <LiquidGlassCard key={`portfolio-${convertedBalance}`} glow="btc" delay={0.1} variant="strong" topFade className="relative">
          <div className="absolute -right-4 -top-4 w-32 h-32 pointer-events-none z-20">
            <DotLottieReact
              src="https://lottie.host/fe692048-2d8f-4966-a2d0-8f9973ce2b3c/9cdpzaKRwx.lottie"
              loop
              autoplay
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted-foreground font-heading">Balance</span>
            </div>

            <div className="mb-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl text-muted-foreground" style={{ fontFamily: "var(--font-heading, system-ui, sans-serif)" }}>{getSymbol()}</span>
                <LiveGrowingBalance
                  value={convertedBalance}
                  perSecond={convert(miningPerSecondUSD)}
                  active={activeMiningPurchases.length > 0}
                  decimals={2}
                  className="text-3xl font-bold text-foreground tracking-tight font-numbers"
                  triggerGlow={balanceIncreased}
                  showBadge={false}
                />
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <div className="flex-1">
                <p className="text-[10px] font-medium font-ui mb-1" style={{ color: "rgb(12, 185, 105)" }}>Estimated Earnings Today</p>
                {activeMiningPurchases.length > 0 && miningPerSecondUSD > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-numbers" style={{ color: "rgb(12, 185, 105)" }}>
                      {getSymbol()}
                      <LiveGrowingBalance value={convert(miningEstimatedTodayUSD)} perSecond={convert(miningPerSecondUSD)} active={true} decimals={8} className="text-sm font-numbers" showBadge={false} />
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No active miners — <button onClick={onNavigateToMining} className="text-emerald-400 underline underline-offset-2 font-medium">Buy one</button></p>
                )}
              </div>
              {activeMiningPurchases.length > 0 && (
                <button onClick={onNavigateToMining} className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors font-ui">
                  Boost <Zap className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
              <span className="text-[10px] text-muted-foreground font-ui">Your Hashpower</span>
              <span className="text-xs font-bold text-foreground font-numbers" data-number>{miningPower || "0 TH/s"}</span>
            </div>

            {pendingTotal > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <div className="flex-1">
                  <p className="text-[10px] text-amber-400 font-medium font-ui">Pending Deposits</p>
                  <p className="text-xs text-amber-300 font-numbers">{getSymbol()}{convert(pendingTotal).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </LiquidGlassCard>

        {/* ── Card 1: Buy a Miner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/20"
        >
          <motion.div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 pointer-events-none" variants={cardShineVariants} animate="animate" />

          <div className="relative flex items-center gap-3 mb-4">
            <motion.img src="/cryptocurrency-mining-rig-with-bitcoin-3d-icon-png-download-13013523.png" alt="Mining" className="w-16 h-16 object-contain drop-shadow-lg" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-foreground">Start Mining Bitcoin</p>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">Buy hashrate plans • Earn daily BTC rewards</p>
            </div>
          </div>

          <Button onClick={onNavigateToMining} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 mb-2 relative overflow-hidden">
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
            <Fan className="w-4 h-4 mr-2" />
            Buy a Miner
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDepositCard} variant="outline" className="h-10 rounded-xl border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-foreground text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />Deposit with Card
            </Button>
            <Button onClick={handleDepositCrypto} variant="outline" className="h-10 rounded-xl border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-foreground text-xs font-semibold">
              <Bitcoin className="w-3.5 h-3.5 mr-1.5 text-amber-400" />Deposit Crypto
            </Button>
          </div>
        </motion.div>

        {/* ── Card 2: Tools & Navigation ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/20"
        >
          <motion.div className="absolute -inset-1 bg-gradient-to-r from-teal-500/0 via-teal-500/15 to-teal-500/0 pointer-events-none" variants={cardShineVariants} animate="animate" />

          <div className="relative flex items-center gap-3 mb-4">
            <motion.img src="/cryptocurrency-platform-3d-icon-png-download-13013496.png" alt="Tools" className="w-14 h-14 object-contain drop-shadow-lg" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-foreground">Manage & Analyze</p>
                <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <p className="text-xs text-muted-foreground">Track miners • Calculate ROI • Review history</p>
            </div>
          </div>

          {/* 3 full-width buttons */}
          <div className="space-y-2 mb-2">
            <Button onClick={handleMyMiners} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 relative overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }} />
              <Cpu className="w-4 h-4 mr-2" />My Miners
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>

            <Button onClick={() => setShowROI(true)} variant="outline" className="w-full h-10 rounded-xl border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/15 text-foreground text-sm font-semibold">
              <Calculator className="w-4 h-4 mr-2 text-teal-400" />ROI Calculator
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/50" />
            </Button>

            <Button onClick={handleHistory} variant="outline" className="w-full h-10 rounded-xl border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 text-foreground text-sm font-semibold">
              <History className="w-4 h-4 mr-2 text-emerald-400" />History
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/50" />
            </Button>
          </div>

          {/* Referral + Feedback 50/50 */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setLocation("/growth")} variant="outline" className="h-10 rounded-xl border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/15 text-foreground text-xs font-semibold flex-col h-14 gap-0.5">
              <div className="flex items-center gap-1.5">
                <img src="/icons/referral.png" className="w-4 h-4 object-contain" alt="Referral" />
                <span>Referral</span>
              </div>
              <span className="text-[9px] text-violet-400 font-normal">Earn from friends</span>
            </Button>
            <Button onClick={() => { window.open("mailto:support@blockmint.app?subject=App Feedback", "_blank"); }} variant="outline" className="h-10 rounded-xl border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-foreground text-xs font-semibold flex-col h-14 gap-0.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Feedback</span>
              </div>
              <span className="text-[9px] text-blue-400 font-normal">Share your thoughts</span>
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* ROI Calculator Portal */}
      <AnimatePresence>
        {showROI && (
          <ROICalculator
            onClose={() => setShowROI(false)}
            onCreateMiner={handleROICreateMiner}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default Dashboard;

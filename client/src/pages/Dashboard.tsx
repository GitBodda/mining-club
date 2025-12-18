import { motion } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, FileText, TrendingUp, Cpu, Clock, DollarSign, Settings } from "lucide-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import type { WalletBalance, Transaction } from "@/lib/types";

import mixedMain from "@assets/Mixed_main_1766014388605.png";
import gpuMining from "@assets/Gpu_Mining_1766014388614.png";

interface DashboardProps {
  balances: WalletBalance[];
  totalBalance: number;
  change24h: number;
  transactions?: Transaction[];
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onOpenSettings?: () => void;
}

export function Dashboard({ 
  balances = [], 
  totalBalance = 0, 
  change24h = 0,
  transactions = [],
  onDeposit, 
  onWithdraw,
  onOpenSettings
}: DashboardProps) {
  const safeChange24h = change24h ?? 0;
  const isPositiveChange = safeChange24h >= 0;
  const activeContracts = 3;
  const totalEarned = 0.00847;
  const miningPower = "125 TH/s";
  const daysActive = 45;

  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold text-foreground">CryptoMine</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            data-testid="button-settings"
            onClick={onOpenSettings}
            className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            data-testid="button-notifications"
            className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </motion.button>
        </div>
      </motion.header>

      <LiquidGlassCard glow="btc" delay={0.1} variant="strong" className="relative">
        <div className="absolute -right-4 -top-4 w-32 h-32 opacity-90 pointer-events-none">
          <motion.img 
            src={mixedMain}
            alt="Mining GPU"
            className="w-full h-full object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">Portfolio Value</span>
          </div>

          <div className="mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg text-muted-foreground">$</span>
              <AnimatedCounter
                value={totalBalance}
                decimals={2}
                className="text-4xl font-bold text-foreground tracking-tight"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className={`text-sm font-medium ${isPositiveChange ? "text-emerald-400" : "text-red-400"}`}>
              {isPositiveChange ? "+" : ""}{safeChange24h.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">24h change</span>
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="button-deposit"
              onClick={onDeposit}
              className="flex-1 liquid-glass border-0 bg-primary/20 text-primary-foreground gap-2"
              variant="ghost"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Deposit
            </Button>
            <Button
              data-testid="button-withdraw"
              onClick={onWithdraw}
              className="flex-1 liquid-glass border-0 bg-white/5 gap-2"
              variant="ghost"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Withdraw
            </Button>
          </div>
        </div>
      </LiquidGlassCard>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <GlassCard delay={0.25} className="p-4 min-h-[100px]">
            <div className="flex items-center gap-3 h-full">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Active Contracts</p>
                <p className="text-lg font-bold text-foreground truncate" data-testid="text-active-contracts">{activeContracts}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.3} className="p-4 min-h-[100px]">
            <div className="flex items-center gap-3 h-full">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Total Earned</p>
                <p className="text-lg font-bold text-foreground truncate" data-testid="text-total-earned">{totalEarned} BTC</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.35} className="p-4 min-h-[100px]">
            <div className="flex items-center gap-3 h-full">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Hash Power</p>
                <p className="text-lg font-bold text-foreground truncate" data-testid="text-hash-power">{miningPower}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.4} className="p-4 min-h-[100px]">
            <div className="flex items-center gap-3 h-full">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">Days Active</p>
                <p className="text-lg font-bold text-foreground truncate" data-testid="text-days-active">{daysActive}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Assets</h2>
        <GlassCard delay={0.5} className="p-4">
          <div className="space-y-4">
            {balances.length > 0 ? (
              balances.slice(0, 3).map((balance, index) => (
                <motion.div
                  key={balance.id}
                  className="flex items-center justify-between gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  data-testid={`asset-row-${balance.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      balance.symbol === 'BTC' ? 'bg-amber-500/20' : 
                      balance.symbol === 'LTC' ? 'bg-blue-500/20' : 
                      balance.symbol === 'USDT' ? 'bg-emerald-500/20' : 'bg-sky-500/20'
                    }`}>
                      <span className={`font-bold ${
                        balance.symbol === 'BTC' ? 'text-amber-400' : 
                        balance.symbol === 'LTC' ? 'text-blue-400' : 
                        balance.symbol === 'USDT' ? 'text-emerald-400' : 'text-sky-400'
                      }`}>{balance.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{balance.name}</p>
                      <p className="text-sm text-muted-foreground">{(balance.balance ?? 0).toFixed(6)} {balance.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${(balance.usdValue ?? 0).toFixed(2)}</p>
                    <p className={`text-sm ${(balance.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(balance.change24h ?? 0) >= 0 ? '+' : ''}{(balance.change24h ?? 0).toFixed(2)}%
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No assets yet</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <GlassCard delay={0.6} className="flex-1 p-4 hover-elevate cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <motion.img 
                src={gpuMining}
                alt="Buy Hashpower"
                className="w-16 h-16 object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <p className="font-medium text-foreground">Buy Hashpower</p>
              <p className="text-xs text-muted-foreground">Increase your mining</p>
            </div>
          </GlassCard>

          <GlassCard delay={0.65} className="flex-1 p-4 hover-elevate cursor-pointer">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="font-medium text-foreground">View Earnings</p>
              <p className="text-xs text-muted-foreground">Track your profits</p>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}

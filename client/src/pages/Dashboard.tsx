import { motion } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, Settings, DollarSign, User } from "lucide-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import type { WalletBalance, Transaction } from "@/lib/types";

import mixedMain from "@assets/Mixed_main_1766014388605.png";
import gpuMining from "@assets/Gpu_Mining_1766014388614.png";
import serverMining from "@assets/Server_Mining_1766014388610.png";
import btcShop from "@assets/Bitcoin_shop_1766014388611.png";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";
import usdcLogo from "@assets/usd-coin-3d-icon-png-download-4102016_1766038596188.webp";

interface DashboardProps {
  balances: WalletBalance[];
  totalBalance: number;
  change24h: number;
  transactions?: Transaction[];
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  isLoggedIn?: boolean;
}

export function Dashboard({ 
  balances = [], 
  totalBalance = 0, 
  change24h = 0,
  transactions = [],
  onDeposit, 
  onWithdraw,
  onOpenSettings,
  onOpenProfile,
  isLoggedIn = false
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
          <p className="text-sm text-muted-foreground">Welcome Back</p>
          <h1 className="text-2xl font-bold text-foreground font-display">Mining Club</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isLoggedIn && (
            <motion.button
              data-testid="button-profile"
              onClick={onOpenProfile}
              className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-5 h-5 text-primary" />
            </motion.button>
          )}
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
            <span className="text-sm text-muted-foreground">24H Change</span>
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="button-deposit"
              onClick={onDeposit}
              className="flex-1 liquid-glass border-0 bg-primary/20 text-foreground gap-2"
              variant="ghost"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Deposit
            </Button>
            <Button
              data-testid="button-withdraw"
              onClick={onWithdraw}
              className="flex-1 liquid-glass border-0 bg-white/5 text-foreground gap-2"
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
        className="flex flex-col gap-3"
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
          whileTap={{ scale: 0.98 }}
          data-testid="card-invite-friend"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
          <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="mountainGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#334155" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            <path d="M0,150 L0,80 Q50,40 100,70 T200,50 T300,80 T400,60 L400,150 Z" fill="url(#mountainGrad1)"/>
            <path d="M0,150 L0,100 Q80,70 150,90 T280,75 T400,95 L400,150 Z" fill="#475569" fillOpacity="0.4"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.img 
              src={serverMining}
              alt="Invite"
              className="w-12 h-12 object-contain"
              whileHover={{ scale: 1.1 }}
            />
            <p className="text-sm font-medium text-foreground text-center px-4 leading-tight max-w-xs">
              Invite A Friend, Both Receive <span className="text-primary font-bold">$20 In BTC</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
          whileTap={{ scale: 0.98 }}
          data-testid="card-rate-app"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
          <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="mountainGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78716c" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#44403c" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
            <path d="M0,150 L0,70 Q60,30 120,60 T240,45 T360,70 T400,55 L400,150 Z" fill="url(#mountainGrad2)"/>
            <path d="M0,150 L0,95 Q100,65 180,85 T320,70 T400,90 L400,150 Z" fill="#57534e" fillOpacity="0.35"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.img 
              src={gpuMining}
              alt="Rate"
              className="w-12 h-12 object-contain"
              whileHover={{ scale: 1.1 }}
            />
            <p className="text-sm font-medium text-foreground text-center px-4 leading-tight max-w-xs">
              Rate Our App, Get <span className="text-amber-400 font-bold">$20 In Hashpower</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <GlassCard delay={0.35} className="p-4 hover-elevate cursor-pointer" glow="primary">
          <div className="flex flex-col items-center text-center gap-3">
            <motion.img 
              src={gpuMining}
              alt="Hashrate"
              className="w-14 h-14 object-contain"
              whileHover={{ scale: 1.05 }}
            />
            <div>
              <p className="text-2xl font-bold text-foreground font-display" data-testid="text-hash-power">{miningPower}</p>
              <p className="text-xs text-muted-foreground">Hashrate</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.4} className="p-4 hover-elevate cursor-pointer">
          <div className="flex flex-col items-center text-center gap-3">
            <motion.img 
              src={serverMining}
              alt="Contracts"
              className="w-14 h-14 object-contain"
              whileHover={{ scale: 1.05 }}
            />
            <div>
              <p className="text-2xl font-bold text-foreground font-display" data-testid="text-active-contracts">{activeContracts}</p>
              <p className="text-xs text-muted-foreground">Active Contracts</p>
            </div>
          </div>
        </GlassCard>
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
                    <img 
                      src={
                        balance.symbol === 'BTC' ? btcLogo : 
                        balance.symbol === 'LTC' ? ltcLogo :
                        balance.symbol === 'USDT' ? usdtLogo : usdcLogo
                      } 
                      alt={balance.symbol}
                      className={`shrink-0 object-contain ${balance.symbol === 'USDT' ? 'w-12 h-12' : 'w-10 h-10'}`}
                    />
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
                <p className="text-muted-foreground">No Assets Yet</p>
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
        <h2 className="text-lg font-semibold text-foreground mb-4 font-display">Premium Features</h2>
        <div className="space-y-3">
          <GlassCard delay={0.6} className="p-4 hover-elevate cursor-pointer" glow="primary">
            <div className="flex items-center gap-4">
              <motion.img 
                src={serverMining}
                alt="Buy Hashpower"
                className="w-14 h-14 object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground font-display">Buy Hashpower</p>
                <p className="text-sm text-muted-foreground">Upgrade Your Mining Capacity</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.65} className="p-4 hover-elevate cursor-pointer" glow="btc">
            <div className="flex items-center gap-4">
              <motion.img 
                src={btcShop}
                alt="Solo Mining"
                className="w-14 h-14 object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground font-display">Solo Mining Jackpot</p>
                <p className="text-sm text-muted-foreground">Win Full 3 BTC Block Rewards</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">3</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, Settings, DollarSign, User, Users, Star, X, Inbox } from "lucide-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { WalletBalance, Transaction } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onNavigateToInvest?: () => void;
  onNavigateToSolo?: () => void;
  isLoggedIn?: boolean;
}

const currencies = [
  { code: 'USD' as const, symbol: '$', name: 'US Dollar' },
  { code: 'EUR' as const, symbol: '\u20AC', name: 'Euro' },
  { code: 'GBP' as const, symbol: '\u00A3', name: 'British Pound' },
  { code: 'AED' as const, symbol: '\u062F.\u0625', name: 'UAE Dirham' },
];

export function Dashboard({ 
  balances = [], 
  totalBalance = 0, 
  change24h = 0,
  transactions = [],
  onDeposit, 
  onWithdraw,
  onOpenSettings,
  onOpenProfile,
  onNavigateToInvest,
  onNavigateToSolo,
  isLoggedIn = false
}: DashboardProps) {
  const { convert, getSymbol, currency, setCurrency } = useCurrency();
  const [showNotifications, setShowNotifications] = useState(false);
  const safeChange24h = change24h ?? 0;
  const isPositiveChange = safeChange24h >= 0;
  const activeContracts = 0;
  const totalEarned = 0;
  const miningPower = "0 TH/s";
  const daysActive = 0;
  const convertedBalance = convert(totalBalance);
  
  const notifications: { id: string; title: string; message: string; time: string }[] = [];

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
          <button
            data-testid="button-settings"
            onClick={onOpenSettings}
            className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate transition-transform active:scale-95"
            type="button"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="button-currency-shortcut"
                className="relative h-10 px-3 rounded-xl liquid-glass flex items-center justify-center gap-1 hover-elevate transition-transform active:scale-95"
                type="button"
              >
                <span className="text-sm font-medium text-foreground">{currency}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="liquid-glass bg-background/95 backdrop-blur-xl border-white/10">
              {currencies.map((curr) => (
                <DropdownMenuItem
                  key={curr.code}
                  onClick={() => setCurrency(curr.code)}
                  className={`cursor-pointer ${currency === curr.code ? 'bg-primary/20' : ''}`}
                  data-testid={`option-currency-${curr.code.toLowerCase()}`}
                >
                  <span className="w-6">{curr.symbol}</span>
                  <span>{curr.code}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <motion.button
              data-testid="button-notifications"
              className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </motion.button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -100, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -100, scale: 0.98 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed right-4 left-4 top-16 liquid-glass bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                  data-testid="panel-notifications"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10"
                      data-testid="button-close-notifications"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-white/5">
                          <p className="font-medium text-foreground text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-2">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-foreground">No Notifications Yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Notifications will appear here when you have mining updates, payouts, or important alerts.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              <span className="text-lg text-muted-foreground">{getSymbol()}</span>
              <AnimatedCounter
                value={convertedBalance}
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
        className="grid grid-cols-2 gap-3"
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
          whileTap={{ scale: 0.98 }}
          data-testid="card-invite-friend"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-slate-950" />
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200">
            <defs>
              <radialGradient id="grad1" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="grad2" cx="70%" cy="70%">
                <stop offset="0%" stopColor="#1e40af" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="80" cy="40" r="120" fill="url(#grad1)"/>
            <circle cx="320" cy="160" r="100" fill="url(#grad2)"/>
            <path d="M0,120 Q100,80 200,100 T400,120 L400,200 L0,200 Z" fill="#3b82f6" fillOpacity="0.08"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Users className="w-8 h-8 text-blue-300" />
            <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
              Invite A Friend, Both Receive <span className="text-blue-400 font-bold">$20 In BTC</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
          whileTap={{ scale: 0.98 }}
          data-testid="card-rate-app"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/60 via-slate-900/80 to-slate-950" />
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200">
            <defs>
              <radialGradient id="grad3" cx="20%" cy="20%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#92400e" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="grad4" cx="80%" cy="80%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#78350f" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="100" cy="50" r="110" fill="url(#grad3)"/>
            <circle cx="300" cy="150" r="90" fill="url(#grad4)"/>
            <path d="M0,130 Q100,90 200,110 T400,130 L400,200 L0,200 Z" fill="#f59e0b" fillOpacity="0.08"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Star className="w-8 h-8 text-amber-300 fill-amber-300" />
            <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
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
                    <p className="font-medium text-foreground">{getSymbol()}{convert(balance.usdValue ?? 0).toFixed(2)}</p>
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
          <GlassCard 
            delay={0.6} 
            className="p-4 hover-elevate cursor-pointer" 
            glow="primary"
            onClick={onNavigateToInvest}
            data-testid="card-buy-hashpower"
          >
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

          <GlassCard 
            delay={0.65} 
            className="p-4 hover-elevate cursor-pointer" 
            glow="btc"
            onClick={onNavigateToSolo}
            data-testid="card-solo-mining-jackpot"
          >
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

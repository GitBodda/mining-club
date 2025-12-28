import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, Settings, DollarSign, User, Users, Star, X, Inbox, Gift, TrendingUp, TrendingDown, Sparkles, ExternalLink, Sun, Moon, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { SiX, SiInstagram } from "react-icons/si";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [hasRatedApp, setHasRatedApp] = useState(() => localStorage.getItem("hasRatedApp") === "true");
  const safeChange24h = change24h ?? 0;
  const isPositiveChange = safeChange24h >= 0;
  const activeContracts = 0;
  const totalEarned = 0;
  const miningPower = "0 TH/s";
  const daysActive = 0;
  const convertedBalance = convert(totalBalance);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && localStorage.getItem("pendingRateReward") === "true") {
        localStorage.removeItem("pendingRateReward");
        localStorage.setItem("hasRatedApp", "true");
        setHasRatedApp(true);
        setShowRewardCelebration(true);
        toast({
          title: "Reward Claimed!",
          description: "You've earned $20 in hashpower for rating the app!",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [toast]);

  const handleRateApp = () => {
    if (hasRatedApp) {
      toast({
        title: "Already Rated",
        description: "You've already received your reward for rating the app.",
      });
      return;
    }
    localStorage.setItem("pendingRateReward", "true");
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const storeUrl = isIOS 
      ? "https://apps.apple.com/app/mining-club/id123456789?action=write-review"
      : "https://play.google.com/store/apps/details?id=com.miningclub.app&showAllReviews=true";
    window.open(storeUrl, "_blank");
  };

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
          <motion.button
            data-testid="button-theme-toggle"
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate transition-transform"
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
            </motion.div>
          </motion.button>
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
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-medium text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
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
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary hover:underline"
                          data-testid="button-mark-all-read"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10"
                        data-testid="button-close-notifications"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                          data-testid={`notification-item-${notif.id}`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.read && (
                              <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            <div className={!notif.read ? '' : 'pl-5'}>
                              <p className="font-medium text-foreground text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                              <p className="text-xs text-muted-foreground/60 mt-2">{notif.time}</p>
                            </div>
                          </div>
                        </button>
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
        <Link href="/referral">
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
                Invite A Friend, Both Receive <span className="text-blue-400 font-bold">$5 In BTC</span>
              </p>
            </div>
          </motion.div>
        </Link>

        <motion.div
          className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
          whileTap={{ scale: 0.98 }}
          onClick={handleRateApp}
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
            {hasRatedApp ? (
              <>
                <Sparkles className="w-8 h-8 text-emerald-400" />
                <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
                  Thank You! <span className="text-emerald-400 font-bold">Reward Claimed</span>
                </p>
              </>
            ) : (
              <>
                <Star className="w-8 h-8 text-amber-300 fill-amber-300" />
                <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
                  Rate Our App, Get <span className="text-amber-400 font-bold">$20 In Hashpower</span>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      <Dialog open={showRewardCelebration} onOpenChange={setShowRewardCelebration}>
        <DialogContent className="liquid-glass border-amber-500/30 bg-gradient-to-br from-amber-950/90 via-slate-900/95 to-slate-950 max-w-sm">
          <motion.div
            className="text-center py-6 space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Gift className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-foreground">Congratulations!</h3>
              <p className="text-amber-400 font-semibold text-lg mt-1">You Earned $20 in Hashpower!</p>
            </motion.div>
            <motion.p
              className="text-muted-foreground text-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Thank you for rating Mining Club! Your reward has been added to your account.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => setShowRewardCelebration(false)}
                data-testid="button-claim-reward"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

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
        transition={{ delay: 0.52 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending Cryptocurrencies
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { symbol: "BTC", name: "Bitcoin", price: 97245.32, change: 2.45, logo: btcLogo, color: "bg-amber-500" },
            { symbol: "LTC", name: "Litecoin", price: 102.34, change: 3.12, logo: ltcLogo, color: "bg-slate-400" },
            { symbol: "USDT", name: "Tether", price: 1.00, change: 0.01, logo: usdtLogo, color: "bg-emerald-500" },
            { symbol: "USDC", name: "USD Coin", price: 1.00, change: -0.02, logo: usdcLogo, color: "bg-blue-500" },
          ].map((crypto, index) => (
            <GlassCard 
              key={crypto.symbol}
              delay={0.53 + index * 0.05} 
              className="p-3"
              data-testid={`trending-crypto-${crypto.symbol.toLowerCase()}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={crypto.logo} 
                  alt={crypto.symbol} 
                  className={`object-contain ${crypto.symbol === 'USDT' ? 'w-10 h-10' : 'w-8 h-8'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{crypto.symbol}</p>
                  <p className="text-xs text-muted-foreground truncate">{crypto.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground text-sm">
                  {getSymbol()}{convert(crypto.price).toLocaleString(undefined, { maximumFractionDigits: crypto.price < 10 ? 2 : 0 })}
                </p>
                <div className={`flex items-center gap-1 ${crypto.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {crypto.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-medium">
                    {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.54 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground font-display flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Portfolio Performance
          </h2>
          <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
            +12.5% This Week
          </span>
        </div>
        <GlassCard delay={0.55} className="p-4" data-testid="chart-portfolio-performance">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart 
              data={[
                { day: "Mon", value: 1000 },
                { day: "Tue", value: 1050 },
                { day: "Wed", value: 1030 },
                { day: "Thu", value: 1120 },
                { day: "Fri", value: 1080 },
                { day: "Sat", value: 1150 },
                { day: "Sun", value: 1200 },
              ]}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background) / 0.95)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${getSymbol()}${convert(value).toFixed(2)}`, 'Value']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#portfolioGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56 }}
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

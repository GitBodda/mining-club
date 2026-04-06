import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, Settings, DollarSign, User, Users, Star, X, Inbox, Gift, TrendingUp, TrendingDown, Sparkles, ExternalLink, Sun, Moon, BarChart3, Copy, Check, Menu, Home, Wallet, PieChart, History, HelpCircle, LogOut, Shield, RefreshCw, ChevronLeft, ChevronRight, Fan, Minus, Plus, Loader2, CheckCircle2, ArrowRight, Zap, Pickaxe } from "lucide-react";
import { Link } from "wouter";
import { SiX, SiInstagram } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
import { OffersSlider } from "@/components/OffersSlider";
import { EducationalSlider } from "@/components/EducationalSlider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { WalletBalance, Transaction, MiningStats } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { FeedbackPrompt } from "@/components/FeedbackPrompt";
import { StripePayButton } from "@/components/StripePayButton";

import mixedMain from "@assets/Mixed_main_1766014388605.webp";
import gpuMining from "@assets/Gpu_Mining_1766014388614.webp";
import serverMining from "@assets/Server_Mining_1766014388610.webp";
import btcShop from "@assets/Bitcoin_shop_1766014388611.webp";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import ethLogo from "@assets/ethereum-eth-3d-logo.png";
import zcashLogo from "@assets/zcash-zec-3d-logo.png";
import tonLogo from "@assets/ton-coin-3d-logo.png";
import bnbLogo from "@assets/bnb-binance-3d-logo.png";
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";
import usdcLogo from "@assets/usd-coin-usdc-logo_1766038726866.png";

type CryptoType = "USDT" | "USDC" | "BTC" | "LTC" | "ETH" | "ZCASH" | "TON" | "BNB";

interface NetworkOption {
  id: string;
  name: string;
}

const cryptoNetworks: Record<CryptoType, NetworkOption[]> = {
  USDT: [
    { id: "usdt-trc20", name: "Tron (TRC-20)" },
    { id: "usdt-erc20", name: "Ethereum (ERC-20)" },
    { id: "usdt-bsc", name: "BNB Smart Chain (BSC/BEP-20)" },
    { id: "usdt-ton", name: "TON Network" },
  ],
  USDC: [
    { id: "usdc-erc20", name: "Ethereum (ERC-20)" },
    { id: "usdc-bsc", name: "BNB Smart Chain (BSC/BEP-20)" },
    { id: "usdc-ton", name: "TON Network" },
  ],
  BTC: [
    { id: "btc-native", name: "Bitcoin (Native)" },
  ],
  LTC: [{ id: "ltc-native", name: "Litecoin (Native)" }],
  ETH: [
    { id: "eth-erc20", name: "Ethereum (ERC-20)" },
    { id: "eth-arbitrum", name: "Arbitrum" },
    { id: "eth-optimism", name: "Optimism" },
  ],
  ZCASH: [{ id: "zcash-native", name: "Zcash (Native)" }],
  TON: [{ id: "ton-native", name: "TON Network" }],
  BNB: [
    { id: "bnb-bsc", name: "BNB Smart Chain (BSC)" },
    { id: "bnb-bep2", name: "BNB Beacon Chain (BEP-2)" },
  ],
};

const generateDepositAddress = (crypto: CryptoType, network: string): string => {
  // Placeholder - actual addresses will be fetched from database
  return "Loading...";
};

// Wallet address mapping from network to config key
const networkToConfigKey: Record<string, string> = {
  "usdt-trc20": "wallet_usdt_trc20",
  "usdt-erc20": "wallet_usdt_erc20",
  "usdt-bsc": "wallet_usdt_bsc",
  "usdt-ton": "wallet_usdt_ton",
  "usdc-erc20": "wallet_usdc_erc20",
  "usdc-bsc": "wallet_usdc_bsc",
  "usdc-ton": "wallet_usdc_ton",
  "btc-native": "wallet_btc_native",
  "ltc-native": "wallet_ltc_native",
  "eth-erc20": "wallet_eth_erc20",
  "eth-arbitrum": "wallet_eth_arbitrum",
  "eth-optimism": "wallet_eth_optimism",
  "zcash-native": "wallet_zcash_native",
  "ton-native": "wallet_ton_native",
  "bnb-bsc": "wallet_bnb_bsc",
  "bnb-bep2": "wallet_bnb_bep2",
};

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

const currencies = [
  { code: 'USD' as const, symbol: '$', name: 'US Dollar' },
  { code: 'EUR' as const, symbol: '\u20AC', name: 'Euro' },
  { code: 'GBP' as const, symbol: '\u00A3', name: 'British Pound' },
  { code: 'AED' as const, symbol: '\u062F.\u0625', name: 'UAE Dirham' },
];

// Recent Activity Component
function RecentActivity({ userId }: { userId: string | null }) {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ["/api/wallet/activity", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/wallet/activity/${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </GlassCard>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <GlassCard className="p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No recent activity</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="space-y-3">
        {activity.slice(0, 5).map((item: any, index: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.type === 'deposit' || item.type === 'earned' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
              }`}>
                {item.type === 'deposit' || item.type === 'earned' ? (
                  <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowUpFromLine className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm text-foreground capitalize">
                  {item.type === 'earned' ? (item.description || 'Daily Yield') : item.type}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium text-sm ${
                item.type === 'deposit' || item.type === 'earned' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {item.type === 'deposit' || item.type === 'earned' ? '+' : '-'}{parseFloat(item.amount).toFixed(2)} {item.currency}
              </p>
              <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                item.status === 'confirmed' || item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                item.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {item.status}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

export function Dashboard({ 
  balances = [], 
  totalBalance = 0, 
  change24h = 0,
  transactions = [],
  miningStats,
  activeContracts = 0,
  portfolioHistory = [],
  onDeposit, 
  onWithdraw,
  onOpenSettings,
  onOpenProfile,
  onNavigateToInvest,
  onNavigateToSolo,
  onNavigateToMining,
  onNavigateToWallet,
  onNavigateToHome,
  isLoggedIn = false,
  onRefreshBalances,
  isFetching = false,
}: DashboardProps) {
  const { convert, getSymbol, currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { toast } = useToast();
  const { prices: cryptoPrices } = useCryptoPrices();
  
  // Ensure required currencies are shown even with 0 balance - ORDER: USDT, BTC, LTC, ETH
  const allCurrencies = [
    { symbol: "USDT", name: "Tether" },
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "LTC", name: "Litecoin" },
    { symbol: "ETH", name: "Ethereum" },
  ];

  // Merge actual balances with all currencies (show 0 if not found) - maintains order
  const balancesWithZeros = allCurrencies.map((curr) => {
    const existing = balances.find(b => b.symbol.toUpperCase() === curr.symbol.toUpperCase());
    if (existing) return { ...existing, symbol: curr.symbol }; // Normalize symbol to uppercase
    
    return {
      id: `zero-${curr.symbol}`,
      symbol: curr.symbol,
      name: curr.name,
      balance: 0,
      usdValue: 0,
      change24h: cryptoPrices[curr.symbol as keyof typeof cryptoPrices]?.change24h || 0,
    };
  });

  // Assets order requirement:
  // 1) USDT
  // 2) BTC
  // 3) LTC
  // 4) ETH
  // then the rest by balance (highest first), then alphabetically.
  const assetPriority: Record<string, number> = { USDT: 0, BTC: 1, LTC: 2, ETH: 3 };
  const sortedBalances = [...balancesWithZeros].sort((a, b) => {
    const aPri = assetPriority[a.symbol] ?? 999;
    const bPri = assetPriority[b.symbol] ?? 999;
    if (aPri !== bPri) return aPri - bPri;

    if (aPri === 999 && bPri === 999) {
      const balanceDiff = (b.balance ?? 0) - (a.balance ?? 0);
      if (balanceDiff !== 0) return balanceDiff;
    }

    return a.symbol.localeCompare(b.symbol);
  });

  // Trending coins should only show market prices for 4 main coins
  const trendingCoins = allCurrencies
    .filter((c) => ["BTC", "ETH", "USDT", "LTC"].includes(c.symbol))
    .map((curr) => {
      const existing = balances.find((b) => b.symbol.toUpperCase() === curr.symbol.toUpperCase());
      return (
        existing ? { ...existing, symbol: curr.symbol } : {
          id: `trending-${curr.symbol}`,
          symbol: curr.symbol,
          name: curr.name,
          balance: 0,
          usdValue: 0,
          change24h:
            cryptoPrices[curr.symbol as keyof typeof cryptoPrices]?.change24h || 0,
        }
      );
    });
  
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState<string>(cryptoNetworks.USDT[0].id);
  const [depositAddress, setDepositAddress] = useState<string>(() => generateDepositAddress("USDT", cryptoNetworks.USDT[0].id));
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [copiedDeposit, setCopiedDeposit] = useState(false);
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [prevBalance, setPrevBalance] = useState(totalBalance);
  const [balanceIncreased, setBalanceIncreased] = useState(false);
  const [showDepositQR, setShowDepositQR] = useState(false);
  const [showStarterModal, setShowStarterModal] = useState(false);

  // Detect when balance increases (from deposit confirmation)
  useEffect(() => {
    if (totalBalance > prevBalance && prevBalance > 0) {
      setBalanceIncreased(true);
      const timer = setTimeout(() => setBalanceIncreased(false), 1500);
      return () => clearTimeout(timer);
    }
    setPrevBalance(totalBalance);
  }, [totalBalance, prevBalance]);

  // Reset QR visibility when deposit popup closes
  useEffect(() => {
    if (!depositOpen) setShowDepositQR(false);
  }, [depositOpen]);

  const [showMenu, setShowMenu] = useState(false);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [hasRatedApp, setHasRatedApp] = useState(() => localStorage.getItem("hasRatedApp") === "true");
  
  const queryClient = useQueryClient();

  // Fetch wallet addresses from database
  const { data: walletAddresses } = useQuery<{ map: Record<string, string>; entries?: any[] } | Record<string, string>>({
    queryKey: ["wallet-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/config/wallets/all");
      if (!res.ok) return { map: {}, entries: [] };
      const data = await res.json();
      if (data?.map || data?.entries) return data;
      return { map: data, entries: [] };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update deposit address when crypto/network changes
  useEffect(() => {
    if (selectedNetwork && walletAddresses) {
      const configKey = networkToConfigKey[selectedNetwork];
      const walletMap = (walletAddresses as any)?.map || walletAddresses;
      const address = walletMap[configKey] || "Address not configured - contact support";
      setDepositAddress(address);
    }
  }, [selectedNetwork, walletAddresses]);

  // Get user ID (from database)
  const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.dbId || user?.id || user?.uid;
  
  console.log("Dashboard user check:", { userStr: !!userStr, user: !!user, userId });

  const { data: miningPurchases = [], isFetched: miningPurchasesFetched } = useQuery<any[]>({
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
  const btcUsdPrice = cryptoPrices?.BTC?.price ?? 0;
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
      // All packages: 0.5% daily of investment amount
      const investment = Number(p?.amount) || 0;
      const dailyUSD = investment * 0.005; // 0.5% daily
      return sum + (dailyUSD / 86400);
    }, 0);
    const miningEstimateMultiplier = Number(estimateConfig?.miningEstimateMultiplier) || 1;
    const miningPerSecondUSD = miningPerSecondUSDBase * miningEstimateMultiplier;

    const secondsSinceMidnight = (() => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      return Math.max(0, Math.floor((Date.now() - midnight.getTime()) / 1000));
    })();
    const miningEstimatedTodayUSD = miningPerSecondUSD * secondsSinceMidnight;

  // Fetch pending deposits
  const { data: pendingDeposits } = useQuery({
    queryKey: ["pending-deposits", userId],
    queryFn: async () => {
      if (!userId) return { requests: [], totals: {} };
      const res = await fetch(`/api/deposits/pending/${userId}`);
      if (!res.ok) return { requests: [], totals: {} };
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Calculate total pending value
  const pendingTotal = Object.entries(pendingDeposits?.totals || {}).reduce((sum, [currency, amount]) => {
    const price = cryptoPrices[currency as keyof typeof cryptoPrices]?.price ?? 0;
    return sum + (amount as number) * price;
  }, 0);

  useEffect(() => {
    if (!userId || !miningPurchasesFetched) return;
    const dismissed = localStorage.getItem("starterMinerModalDismissed") === "true";
    const hasPaidPurchases = (activeMiningPurchases?.length || 0) > 0;
    // Only show to new users (account created within last 7 days)
    const userCreatedAt = user?.createdAt ? new Date(user.createdAt).getTime() : 0;
    const isNewUser = userCreatedAt > 0 && (Date.now() - userCreatedAt) < 7 * 24 * 60 * 60 * 1000;
    if (!hasPaidPurchases && !dismissed && isNewUser) {
      setShowStarterModal(true);
    }
  }, [userId, activeMiningPurchases.length, miningPurchasesFetched]);

  // Submit deposit request mutation
  const submitDepositMutation = useMutation({
    mutationFn: async (data: { amount: string; currency: string; network: string; walletAddress: string }) => {
      // Recheck userId at submission time
      const currentUserStr = localStorage.getItem("user");
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      // Fallback to Firebase auth instance if localStorage is missing/stale
      const currentUserId = currentUser?.dbId || currentUser?.id || currentUser?.uid || auth?.currentUser?.uid;
      
      console.log("Submitting deposit:", { currentUser, currentUserId, data });
      
      if (!currentUserId) {
        console.error("No userId found in localStorage or Auth state:", { currentUserStr, currentUser, authUser: auth?.currentUser?.uid });
        // Try to get from firebaseUser as fallback
        const firebaseUserStr = localStorage.getItem("firebaseUser");
        if (firebaseUserStr) {
          const fbUser = JSON.parse(firebaseUserStr);
          console.log("Trying firebaseUser fallback:", fbUser);
        }
        throw new Error("Authentication error. Please log out and log in again.");
      }

      // Get Firebase ID token for authorization
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

      const res = await fetch("/api/deposits/request", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(idToken && { "Authorization": `Bearer ${idToken}` })
        },
        body: JSON.stringify({
          userId: currentUserId,
          amount: data.amount,
          currency: data.currency,
          network: data.network,
          walletAddress: data.walletAddress,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit deposit request");
      }
      return res.json();
    },
    onSuccess: () => {
      setDepositSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["pending-deposits"] });
      toast({
        title: "Deposit Request Submitted!",
        description: "We'll confirm your deposit once we verify the transaction. This usually takes 10-30 minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Submit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Enter Amount",
        description: "Please enter the amount you deposited.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate USD value and check minimum deposit of $20
    const amount = parseFloat(depositAmount);
    const price = cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 0;
    
    // Only validate if price is loaded (not 0)
    if (price > 0) {
      const usdValue = amount * price;
      
      if (usdValue < 20) {
        const minAmount = (20 / price).toFixed(8);
        toast({
          title: "Minimum Deposit Not Met",
          description: `Minimum deposit is $20. Please deposit at least ${minAmount} ${selectedCrypto} (${getSymbol()}${convert(20).toFixed(2)}).`,
          variant: "destructive",
        });
        return;
      }
    }
    
    submitDepositMutation.mutate({
      amount: depositAmount,
      currency: selectedCrypto,
      network: selectedNetwork,
      walletAddress: depositAddress,
    });
  };

  // Calculate real portfolio change based on actual price movements
  const calculateRealPortfolioChange = () => {
    if (!sortedBalances || sortedBalances.length === 0 || totalBalance === 0) {
      return 0;
    }

    let totalCurrentValue = 0;
    let totalValue24hAgo = 0;

    sortedBalances.forEach(balance => {
      const cryptoData = cryptoPrices[balance.symbol as keyof typeof cryptoPrices];
      const currentPrice = cryptoData?.price || 0;
      const change24h = cryptoData?.change24h || 0;
      
      // Calculate current USD value
      const currentValue = balance.balance * currentPrice;
      
      // Calculate value 24h ago
      const price24hAgo = currentPrice / (1 + change24h / 100);
      const value24hAgo = balance.balance * price24hAgo;
      
      totalCurrentValue += currentValue;
      totalValue24hAgo += value24hAgo;
    });

    // Calculate percentage change
    if (totalValue24hAgo === 0) return 0;
    return ((totalCurrentValue - totalValue24hAgo) / totalValue24hAgo) * 100;
  };

  const realPortfolioChange = calculateRealPortfolioChange();
  const safeChange24h = realPortfolioChange;
  const isPositiveChange = safeChange24h >= 0;
  const totalEarned = 0;
  const daysActive = 0;
  const convertedBalance = convert(totalBalance);
  
  const calculateTotalHashrateTH = () => {
    if (!activeMiningPurchases.length) return 0;
    
    return activeMiningPurchases
      .filter((p: any) => !String(p?.packageName || "").includes("Solo Mining"))
      .reduce((acc, p) => {
      let val = Number(p.hashrate) || 0;
      const unit = (p.hashrateUnit || "TH/s").toUpperCase();
      
      // Normalize to TH/s
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
    
    // Format large numbers with K suffix as requested (e.g. 50000 TH -> 50K TH)
    if (th >= 1000) {
      return `${(th / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K TH/s`;
    }
    
    // If very small (less than 0.01 TH), show as GH or MH
    if (th < 0.000001) return `${(th * 1000000).toFixed(0)} MH/s`;
    if (th < 0.001) return `${(th * 1000).toFixed(0)} GH/s`;
    
    return `${Number(th.toFixed(2))} TH/s`;
  };

  const miningPower = formatHashrate(totalHashrateTH);
  const activeContractsCount = activeMiningPurchases.length;
  const selectedBalance = balances.find((b) => b.symbol.toUpperCase() === selectedCrypto.toUpperCase())?.balance ?? 0;

  const handleSelectCrypto = (value: string) => {
    const crypto = value as CryptoType;
    setSelectedCrypto(crypto);
    const firstNetwork = cryptoNetworks[crypto]?.[0]?.id ?? cryptoNetworks.USDT[0].id;
    setSelectedNetwork(firstNetwork);
    // Address will be set by useEffect
    setDepositSubmitted(false);
  };

  const handleSelectNetwork = (value: string) => {
    setSelectedNetwork(value);
    // Address will be set by useEffect
    setDepositSubmitted(false);
  };

  const copyDepositAddress = async () => {
    if (!depositAddress) return;
    await navigator.clipboard.writeText(depositAddress);
    setCopiedDeposit(true);
    setTimeout(() => setCopiedDeposit(false), 1500);
    toast({ title: "Copied", description: "Deposit address copied to clipboard." });
  };

  const openDeposit = (e?: React.MouseEvent) => {
    if (onDeposit) return onDeposit();
    // Redirect to wallet page instead of opening popup
    if (onNavigateToWallet) {
      e?.preventDefault();
      e?.stopPropagation();
      onNavigateToWallet();
      return;
    }
    setWithdrawOpen(false);
    setDepositAmount("");
    setDepositSubmitted(false);
    setDepositOpen((v) => !v);
  };

  const openWithdraw = (e?: React.MouseEvent) => {
    if (onWithdraw) return onWithdraw();
    // Redirect to wallet page instead of opening popup
    if (onNavigateToWallet) {
      e?.preventDefault();
      e?.stopPropagation();
      onNavigateToWallet();
      return;
    }
    setDepositOpen(false);
    setWithdrawOpen((v) => !v);
  };

  const confirmWithdraw = () => {
    toast({
      title: "Withdraw request created",
      description: "This will be connected to DeFi wallet later.",
    });
    setWithdrawOpen(false);
    setWithdrawAmount("");
    setWithdrawAddress("");
  };

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
    <>
      <motion.div
        className="flex flex-col gap-6 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >


        <LiquidGlassCard key={`portfolio-${convertedBalance}`} glow="btc" delay={0.1} variant="strong" topFade className="relative">
        <div className="absolute -right-4 -top-4 w-32 h-32 pointer-events-none z-20">
          <DotLottieReact
            src="https://lottie.host/fe692048-2d8f-4966-a2d0-8f9973ce2b3c/9cdpzaKRwx.lottie"
            loop
            autoplay
          />
        </div>

        <div className="relative z-10">
          {/* Portfolio label with green dot */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-heading">Balance</span>
          </div>

          {/* Balance display — centered */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl text-muted-foreground" style={{ fontFamily: 'var(--font-heading, system-ui, sans-serif)' }}>{getSymbol()}</span>
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

          {/* Estimated Earnings Today — always visible */}
          <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
            <div className="flex-1">
              <p className="text-[10px] font-medium font-ui mb-1" style={{ color: 'rgb(12, 185, 105)' }}>Estimated Earnings Today</p>
              {activeMiningPurchases.length > 0 && miningPerSecondUSD > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-numbers" style={{ color: 'rgb(12, 185, 105)' }}>
                    {getSymbol()}
                    <LiveGrowingBalance
                      value={convert(miningEstimatedTodayUSD)}
                      perSecond={convert(miningPerSecondUSD)}
                      active={true}
                      decimals={8}
                      className="text-sm font-numbers"
                      showBadge={false}
                    />
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No active miners — <button onClick={onNavigateToMining} className="text-emerald-400 underline underline-offset-2 font-medium">Create one</button></p>
              )}
            </div>
            {activeMiningPurchases.length > 0 && (
              <button onClick={onNavigateToMining} className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors font-ui">
                Boost
                <Zap className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Your Hashpower */}
          <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
            <span className="text-[10px] text-muted-foreground font-ui">Your Hashpower</span>
            <span className="text-xs font-bold text-foreground font-numbers" data-number>{miningPower || "0 TH/s"}</span>
          </div>

          {/* Pending Deposits Display */}
          {pendingTotal > 0 && (
            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="flex-1">
                <p className="text-[10px] text-amber-400 font-medium font-ui">Pending Deposits</p>
                <p className="text-xs text-amber-300 font-numbers">
                  {getSymbol()}{convert(pendingTotal).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-5 px-4">
            <div className="flex flex-col items-center gap-1.5">
            <Popover open={depositOpen} onOpenChange={setDepositOpen}>
              <PopoverTrigger asChild>
                <Button
                  data-testid="button-deposit"
                  onClick={(e) => {
                    if (onNavigateToWallet) {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigateToWallet();
                    } else {
                      openDeposit(e);
                    }
                  }}
                  className="w-11 h-11 liquid-glass border-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-2xl p-0"
                  variant="ghost"
                  type="button"
                >
                  <ArrowUpFromLine className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={45}
                avoidCollisions={true}
                collisionPadding={{ top: 60, bottom: 20, left: 16, right: 16 }}
                className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(380px,calc(100vw-2rem))] max-h-[50vh] overflow-y-auto p-2 md:p-3"
                data-testid="popover-deposit"
              >
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-foreground">Deposit</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Choose currency and network</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs">Currency</Label>
                      <Select value={selectedCrypto} onValueChange={handleSelectCrypto}>
                        <SelectTrigger className="liquid-glass border-white/10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                          {(["USDT", "USDC", "BTC", "LTC", "ETH", "ZCASH", "TON", "BNB"] as CryptoType[]).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Network</Label>
                      <Select value={selectedNetwork} onValueChange={handleSelectNetwork}>
                        <SelectTrigger className="liquid-glass border-white/10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                          {(cryptoNetworks[selectedCrypto] ?? []).map((n) => (
                            <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-xs">Deposit address</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={depositAddress} className="liquid-glass border-white/10 text-[10px] md:text-xs" />
                      <Button variant="secondary" className="liquid-glass border-0 h-9 px-2" onClick={copyDepositAddress} type="button">
                        {copiedDeposit ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
                      </Button>
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-2">
                      {!showDepositQR ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8 border-white/10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400"
                          onClick={() => setShowDepositQR(true)}
                          type="button"
                        >
                          Show QR Code
                        </Button>
                      ) : (
                        <>
                          <div className="relative group">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(depositAddress)}&margin=8`}
                              alt="Deposit QR Code"
                              className="w-24 h-24 md:w-28 md:h-28 rounded-lg border-2 border-white/20 bg-white p-1 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(depositAddress)}&margin=10`, '_blank')}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <div className="bg-black/60 text-white text-[10px] md:text-xs px-2 py-1 rounded-full">
                                Click to enlarge
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] md:text-xs text-center text-muted-foreground max-w-[260px]">
                            Scan QR to deposit. Click to enlarge. Verify network to avoid loss.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`0.00 ${selectedCrypto}`}
                      className="liquid-glass border-white/10 h-9 text-xs"
                      inputMode="decimal"
                    />
                    <p className="text-[10px] md:text-xs text-emerald-400">
                      Minimum deposit: {getSymbol()}20.00 ({((20 / (cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 1))).toFixed(8)} {selectedCrypto})
                    </p>
                  </div>

                  <div className="text-[10px] md:text-xs text-muted-foreground space-y-0.5">
                    <p>Live price: {getSymbol()}{convert(cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 0).toFixed(2)}</p>
                    <p className="text-amber-400">⚠️ Warning: Sending on the wrong network can result in permanent loss.</p>
                  </div>

                  {/* Deposit Confirmation Button */}
                  {!depositSubmitted ? (
                    <>
                      <Button
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-9 md:h-10 text-xs md:text-sm"
                        onClick={handleSubmitDeposit}
                        disabled={submitDepositMutation.isPending || !depositAmount || !depositAddress}
                        data-testid="button-confirm-deposit"
                      >
                        {submitDepositMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            I Have Completed My Deposit
                          </>
                        )}
                      </Button>
                      {/* Quick Card Deposit via Stripe */}
                      {userId && depositAmount && parseFloat(depositAmount) > 0 && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-[10px] text-muted-foreground text-center mb-1">Or deposit instantly with card</p>
                          <StripePayButton
                            userId={userId}
                            amount={parseFloat(depositAmount)}
                            productType="wallet_deposit"
                            productName={`Wallet Deposit - $${parseFloat(depositAmount).toFixed(2)}`}
                            metadata={{ depositCurrency: selectedCrypto }}
                            variant="outline"
                            className="w-full h-9"
                            onPaymentSuccess={() => {
                              queryClient.invalidateQueries();
                              setDepositSubmitted(true);
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs md:text-sm font-medium text-emerald-400">Submitted!</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">We'll verify within 10-30 min.</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => {
                          setDepositSubmitted(false);
                          setDepositAmount("");
                        }}
                      >
                        Submit Another
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-[10px] text-muted-foreground font-ui">Deposit</p>
            </div>
            
            <div className="flex flex-col items-center gap-1.5">
            <motion.div
              className="relative"
              animate={{
                boxShadow: [
                  "0 0 15px 2px rgba(16, 185, 129, 0.3)",
                  "0 0 25px 4px rgba(16, 185, 129, 0.5)",
                  "0 0 15px 2px rgba(16, 185, 129, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ borderRadius: "1rem" }}
            >
              <Button
                data-testid="button-create-miner"
                onClick={onNavigateToMining}
                className="w-11 h-11 relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 flex items-center justify-center rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 p-0"
                variant="ghost"
                type="button"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <Fan className="w-4 h-4" />
              </Button>
            </motion.div>
            <p className="text-[10px] text-muted-foreground font-ui">Create Miner</p>
            </div>

            <div className="flex flex-col items-center gap-1.5">
            <Popover open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <PopoverTrigger asChild>
                <Button
                  data-testid="button-withdraw"
                  onClick={(e) => {
                    if (onNavigateToWallet) {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigateToWallet();
                    } else {
                      openWithdraw(e);
                    }
                  }}
                  className="w-11 h-11 liquid-glass border-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center rounded-2xl p-0"
                  variant="ghost"
                  type="button"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={45}
                avoidCollisions={true}
                collisionPadding={{ top: 60, bottom: 20, left: 16, right: 16 }}
                className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(380px,calc(100vw-2rem))] max-h-[50vh] overflow-y-auto p-2 md:p-3"
                data-testid="popover-withdraw"
              >
                <div className="space-y-2 md:space-y-3">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-foreground">Withdraw</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Choose currency and network</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs">Currency</Label>
                      <Select value={selectedCrypto} onValueChange={handleSelectCrypto}>
                        <SelectTrigger className="liquid-glass border-white/10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                          {(["USDT", "USDC", "BTC", "LTC", "ETH", "ZCASH", "TON", "BNB"] as CryptoType[]).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs">Network</Label>
                      <Select value={selectedNetwork} onValueChange={handleSelectNetwork}>
                        <SelectTrigger className="liquid-glass border-white/10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                          {(cryptoNetworks[selectedCrypto] ?? []).map((n) => (
                            <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-xs">Recipient address</Label>
                    <Input
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="Paste address"
                      className="liquid-glass border-white/10 h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-xs">Amount</Label>
                    <div className="flex gap-2">
                      <Input
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`0.00 ${selectedCrypto}`}
                        className="liquid-glass border-white/10 flex-1 h-9 text-xs"
                        inputMode="decimal"
                      />
                      <Button
                        variant="secondary"
                        className="liquid-glass border-0 h-9 px-2 text-xs"
                        type="button"
                        onClick={() => setWithdrawAmount(selectedBalance.toString())}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Balance: {selectedBalance.toFixed(6)} {selectedCrypto}</p>
                  </div>

                  <div className="text-[10px] md:text-xs text-amber-400 bg-amber-400/10 p-2 rounded-lg">
                    Warning: Selecting the wrong blockchain network can lead to irreversible loss of funds. Double-check the network before confirming.
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" className="liquid-glass border-0 h-9 text-xs" onClick={() => setWithdrawOpen(false)} type="button">
                      Cancel
                    </Button>
                    <Button
                      className="liquid-glass border-0 bg-primary/20 text-foreground h-9 text-xs"
                      onClick={confirmWithdraw}
                      type="button"
                      disabled={!withdrawAddress || !withdrawAmount}
                      data-testid="button-confirm-withdraw-dashboard"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-[10px] text-muted-foreground font-ui">Withdraw</p>
            </div>
          </div>
        </div>
      </LiquidGlassCard>



      {/* Hashrate and Active Contracts - Moved to top */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <div onClick={onNavigateToMining} className="cursor-pointer">
          <GlassCard delay={0.25} className="p-3 h-[88px] hover-elevate cursor-pointer" glow="primary" data-testid="card-hashrate">
            <div className="flex items-center justify-between gap-2 h-full min-h-0">
              <div className="text-left">
                <p className="text-xl font-bold text-foreground font-display" data-testid="text-hash-power">{miningPower}</p>
                <p className="text-xs text-muted-foreground">Hashrate</p>
              </div>
              <motion.img 
                src="/icons/hashrate.png"
                alt="Hashrate"
                className="w-[64px] h-[64px] object-contain drop-shadow-md"
                whileHover={{ scale: 1.05 }}
              />
            </div>
          </GlassCard>
        </div>

        <div onClick={onNavigateToMining} className="cursor-pointer">
          <GlassCard delay={0.3} className="p-3 h-[88px] hover-elevate cursor-pointer" glow="primary" data-testid="card-active-contracts">
            <div className="flex items-center justify-between gap-2 h-full min-h-0">
              <div className="text-left">
                <p className="text-xl font-bold text-foreground font-display" data-testid="text-active-contracts">{activeContractsCount}</p>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
              </div>
              <motion.img 
                src="/icons/contracts.png"
                alt="Contracts"
                className="w-[64px] h-[64px] object-contain drop-shadow-md"
                whileHover={{ scale: 1.05 }}
              />
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Mining Promo Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        onClick={onNavigateToMining}
        className="cursor-pointer"
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
          
          <div className="relative flex items-center gap-3">
            <motion.img
              src="/icons/asic-miner.png"
              alt="Mining"
              className="w-20 h-20 object-contain drop-shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-foreground">Start Mining Bitcoin</p>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                Buy mining devices & hashrate plans • Earn daily BTC rewards
              </p>
            </div>
            
            <motion.div
              className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight className="w-5 h-5 text-emerald-400" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Growth Hub & Rate App Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 gap-3"
      >
        <Link href="/growth">
        <motion.div
            className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
            whileTap={{ scale: 0.98 }}
            data-testid="card-growth-hub-main"
          >
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-violet-950/60 dark:via-slate-900/80 dark:to-slate-950 bg-gradient-to-br from-violet-100/80 via-slate-50/90 to-violet-50" />
            <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-30 opacity-20" viewBox="0 0 400 200">
              <defs>
                <radialGradient id="grad1" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#4c1d95" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="grad2" cx="70%" cy="70%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#4c1d95" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <circle cx="80" cy="40" r="120" fill="url(#grad1)"/>
              <circle cx="320" cy="160" r="100" fill="url(#grad2)"/>
              <path d="M0,120 Q100,80 200,100 T400,120 L400,200 L0,200 Z" fill="#8b5cf6" fillOpacity="0.08"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <img src="/icons/referral.png" alt="Referral" className="w-20 h-20 object-contain" />
              <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
                Referral <span className="text-violet-400 font-bold">Program</span>
              </p>
            </div>
          </motion.div>
        </Link>

        <motion.div
          className="relative overflow-hidden rounded-2xl h-40"
          data-testid="card-rate-app"
        >
          <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-violet-950/60 dark:via-slate-900/80 dark:to-slate-950 bg-gradient-to-br from-violet-100/80 via-slate-50/90 to-violet-50" />
          <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-30 opacity-20" viewBox="0 0 400 200">
            <defs>
              <radialGradient id="grad3" cx="20%" cy="20%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="grad4" cx="80%" cy="80%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="100" cy="50" r="110" fill="url(#grad3)"/>
            <circle cx="300" cy="150" r="90" fill="url(#grad4)"/>
            <path d="M0,130 Q100,90 200,110 T400,130 L400,200 L0,200 Z" fill="#8b5cf6" fillOpacity="0.08"/>
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
                <img src="/icons/dizzy-star.png" alt="Stars" className="w-16 h-16" />
                <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
                  Share Your Feedback <span className="text-violet-400 font-bold">& Unlock Rewards</span>
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
              Thank you for rating BlockMint! Your reward has been added to your account.
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
        transition={{ delay: 0.45 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Assets</h2>
        <GlassCard delay={0.5} className="p-4">
          <div className="space-y-4">
            {balancesWithZeros.length > 0 ? (
              balancesWithZeros.map((balance, index) => (
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
                        balance.symbol === 'USDT' ? usdtLogo :
                        balance.symbol === 'USDC' ? usdcLogo :
                        balance.symbol === 'BTC' ? btcLogo : 
                        balance.symbol === 'LTC' ? ltcLogo :
                        balance.symbol === 'ETH' ? ethLogo :
                        balance.symbol === 'ZCASH' ? zcashLogo :
                        balance.symbol === 'TON' ? tonLogo :
                        balance.symbol === 'BNB' ? bnbLogo : ethLogo
                      } 
                      alt={balance.symbol}
                      className="shrink-0 object-contain w-10 h-10"
                    />
                    <div>
                      <p className="font-medium text-foreground">{balance.name}</p>
                      <p className="text-sm text-muted-foreground">{(balance.balance ?? 0).toFixed(6)} {balance.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const price = cryptoPrices[balance.symbol as keyof typeof cryptoPrices]?.price || 0;
                      const usdValue = (balance.balance ?? 0) * price;
                      const change24h = cryptoPrices[balance.symbol as keyof typeof cryptoPrices]?.change24h || balance.change24h || 0;
                      return (
                        <>
                          <p className="font-medium text-foreground">{getSymbol()}{convert(usdValue).toFixed(2)}</p>
                          <p className={`text-sm ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                          </p>
                        </>
                      );
                    })()}
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

      {/* Promotional Offers Slider */}
      <OffersSlider />

      {/* Educational Slider */}
      <EducationalSlider />

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
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="grid grid-cols-2 gap-3 min-w-max sm:min-w-0">
          {trendingCoins.map((balance, index) => {
            const cryptoData = cryptoPrices[balance.symbol as keyof typeof cryptoPrices];
            const price = balance.symbol === "USDT" ? 1 : (cryptoData?.price || 0);
            const change24h = balance.symbol === "USDT" ? 0 : (cryptoData?.change24h || balance.change24h || 0);
            
            return (
              <GlassCard 
                key={balance.id}
                delay={0.53 + index * 0.05} 
                className="p-3 w-40 sm:w-auto"
                data-testid={`trending-crypto-${balance.symbol.toLowerCase()}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={
                      balance.symbol === 'USDT' ? usdtLogo :
                      balance.symbol === 'USDC' ? usdcLogo :
                      balance.symbol === 'BTC' ? btcLogo : 
                      balance.symbol === 'LTC' ? ltcLogo :
                      balance.symbol === 'ETH' ? ethLogo :
                      balance.symbol === 'ZCASH' ? zcashLogo :
                      balance.symbol === 'TON' ? tonLogo :
                      balance.symbol === 'BNB' ? bnbLogo : ethLogo
                    } 
                    alt={balance.symbol}
                    className="object-contain w-8 h-8"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{balance.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{balance.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground text-sm">
                    {getSymbol()}{convert(price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center gap-1 ${change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
          </div>
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
          <span className={`text-xs ${safeChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'} font-medium ${safeChange24h >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} px-2 py-1 rounded-full`}>
            {safeChange24h >= 0 ? '+' : ''}{safeChange24h.toFixed(2)}% This Week
          </span>
        </div>
        <GlassCard delay={0.55} className="p-4" data-testid="chart-portfolio-performance">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart 
              data={(() => {
                // Calculate portfolio value for each day based on current balance and crypto prices
                // Using a simulation of 7 days with growth based on 24h change
                const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                const currentValue = balances.reduce((sum, balance) => {
                  const price = cryptoPrices[balance.symbol as keyof typeof cryptoPrices]?.price || 0;
                  return sum + ((balance.balance ?? 0) * price);
                }, 0);
                
                const changePercent = safeChange24h / 100;
                const dayChangePercent = changePercent / 7; // Distribute change across 7 days
                
                return days.map((day, index) => {
                  // Simulate gradual growth over the week
                  const growthFactor = 1 + (dayChangePercent * (index + 1));
                  const value = currentValue * growthFactor;
                  return { day, value };
                });
              })()}
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
        transition={{ delay: 0.59 }}
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
            data-testid="card-solo-mining"
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
                <p className="font-semibold text-foreground font-display">Solo Block Hunt</p>
                <p className="text-sm text-muted-foreground">Full 3.125 BTC Block Rewards</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">3</span>
              </div>
            </div>
          </GlassCard>


        </div>
      </motion.div>
      </motion.div>

      {/* Starter Miner onboarding modal */}
      {showStarterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="w-full max-w-md rounded-3xl border border-orange-500/30 bg-background/95 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-3xl" />
            <div className="relative z-10 p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold">Free Starter Miner</p>
                  <p className="text-sm text-muted-foreground mt-0.5">You've been given <span className="text-orange-400 font-semibold">0.5 TH/s free</span> cloud mining power for 365 days — no purchase needed.</p>
                </div>
                <button
                  aria-label="Dismiss starter miner modal"
                  className="text-muted-foreground hover:text-foreground p-1"
                  onClick={() => {
                    localStorage.setItem("starterMinerModalDismissed", "true");
                    setShowStarterModal(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Perks */}
              <div className="space-y-2 text-sm">
                {[
                  "Activated automatically — no card required",
                  "Earns real Bitcoin (Satoshis) every day for 365 days",
                  "Share your referral link to earn $10 USDT per friend",
                  "First 1,000 users get a permanent Founding Member badge",
                ].map((perk) => (
                  <div key={perk} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link href="/growth/starter">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0 font-bold shadow-md shadow-orange-500/25"
                    onClick={() => {
                      localStorage.setItem("starterMinerModalDismissed", "true");
                      setShowStarterModal(false);
                    }}
                  >
                    View My Miner
                  </Button>
                </Link>
                <Link href="/growth">
                  <Button
                    variant="outline"
                    className="w-full border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => {
                      localStorage.setItem("starterMinerModalDismissed", "true");
                      setShowStarterModal(false);
                    }}
                  >
                    Growth Hub
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Feedback Prompt - shows for eligible users */}
      <FeedbackPrompt />
    </>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowDownToLine, ArrowUpFromLine, Settings, DollarSign, User, Users, Star, X, Inbox, Gift, TrendingUp, TrendingDown, Sparkles, ExternalLink, Sun, Moon, BarChart3, Copy, Check, Menu, Home, Wallet, PieChart, History, HelpCircle, LogOut, Shield, RefreshCw, ChevronLeft, ChevronRight, Fan, Minus, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { SiX, SiInstagram } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
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

type CryptoType = "BTC" | "LTC" | "ETH" | "ZCASH" | "TON" | "BNB";

interface NetworkOption {
  id: string;
  name: string;
}

const cryptoNetworks: Record<CryptoType, NetworkOption[]> = {
  BTC: [
    { id: "btc-native", name: "Bitcoin (Native)" },
    { id: "btc-lightning", name: "Lightning Network" },
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
  "btc-native": "wallet_btc_native",
  "btc-lightning": "wallet_btc_lightning",
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
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("BTC");
  const [selectedNetwork, setSelectedNetwork] = useState<string>(cryptoNetworks.BTC[0].id);
  const [depositAddress, setDepositAddress] = useState<string>(() => generateDepositAddress("BTC", cryptoNetworks.BTC[0].id));
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [copiedDeposit, setCopiedDeposit] = useState(false);
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRewardCelebration, setShowRewardCelebration] = useState(false);
  const [hasRatedApp, setHasRatedApp] = useState(() => localStorage.getItem("hasRatedApp") === "true");
  
  const queryClient = useQueryClient();

  // Fetch wallet addresses from database
  const { data: walletAddresses } = useQuery({
    queryKey: ["wallet-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/config/wallets/all");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update deposit address when crypto/network changes
  useEffect(() => {
    if (selectedNetwork && walletAddresses) {
      const configKey = networkToConfigKey[selectedNetwork];
      const address = walletAddresses[configKey] || "Address not configured - contact support";
      setDepositAddress(address);
    }
  }, [selectedNetwork, walletAddresses]);

  // Get user ID
  const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.uid;

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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate total pending value
  const pendingTotal = Object.entries(pendingDeposits?.totals || {}).reduce((sum, [currency, amount]) => {
    const price = cryptoPrices[currency as keyof typeof cryptoPrices]?.price ?? 0;
    return sum + (amount as number) * price;
  }, 0);

  // Submit deposit request mutation
  const submitDepositMutation = useMutation({
    mutationFn: async (data: { amount: string; currency: string; network: string; walletAddress: string }) => {
      if (!userId) throw new Error("Please log in to submit deposit");

      const res = await fetch("/api/deposits/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
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
    
    submitDepositMutation.mutate({
      amount: depositAmount,
      currency: selectedCrypto,
      network: selectedNetwork,
      walletAddress: depositAddress,
    });
  };

  const safeChange24h = change24h ?? 0;
  const isPositiveChange = safeChange24h >= 0;
  const totalEarned = 0;
  const daysActive = 0;
  const convertedBalance = convert(totalBalance);
  
  const hashRate = miningStats?.hashRate ?? 0;
  const hashRateUnit = miningStats?.hashRateUnit ?? "TH/s";
  const miningPower = hashRate > 0 ? `${hashRate} ${hashRateUnit}` : "0 TH/s";
  const selectedBalance = balances.find((b) => b.symbol === selectedCrypto)?.balance ?? 0;

  const handleSelectCrypto = (value: string) => {
    const crypto = value as CryptoType;
    setSelectedCrypto(crypto);
    const firstNetwork = cryptoNetworks[crypto]?.[0]?.id ?? cryptoNetworks.BTC[0].id;
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

  const openDeposit = () => {
    if (onDeposit) return onDeposit();
    setWithdrawOpen(false);
    setDepositAmount("");
    setDepositSubmitted(false);
    setDepositOpen((v) => !v);
  };

  const openWithdraw = () => {
    if (onWithdraw) return onWithdraw();
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
        <LiquidGlassCard glow="btc" delay={0.1} variant="strong" className="relative">
        <div className="absolute -right-4 -top-4 w-32 h-32 pointer-events-none">
          <DotLottieReact
            src="https://lottie.host/fe692048-2d8f-4966-a2d0-8f9973ce2b3c/9cdpzaKRwx.lottie"
            loop
            autoplay
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">Portfolio Value</span>
          </div>

          <div className="mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground">{getSymbol()}</span>
              <AnimatedCounter
                value={convertedBalance}
                decimals={2}
                className="text-3xl font-bold text-foreground tracking-tight"
              />
              {onRefreshBalances && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefreshBalances}
                  disabled={isFetching}
                  className="ml-2 h-7 w-7 p-0 rounded-full liquid-glass border border-primary/25 shadow-sm shrink-0"
                  aria-label="Refresh balances"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className={`text-sm font-medium ${isPositiveChange ? "text-emerald-400" : "text-red-400"}`}>
              {isPositiveChange ? "+" : ""}{safeChange24h.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">24H Change</span>
          </div>

          {/* Pending Deposits Display */}
          {pendingTotal > 0 && (
            <div className="mb-4 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="flex-1">
                <p className="text-xs text-amber-400 font-medium">Pending Deposits</p>
                <p className="text-sm text-amber-300">
                  {getSymbol()}{convert(pendingTotal).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Popover open={depositOpen} onOpenChange={setDepositOpen}>
              <PopoverTrigger asChild>
                <Button
                  data-testid="button-deposit"
                  onClick={openDeposit}
                  className="flex-1 liquid-glass border-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center h-12 rounded-2xl"
                  variant="ghost"
                  type="button"
                >
                  <ArrowUpFromLine className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={10}
                className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(380px,calc(100vw-1.5rem))]"
                data-testid="popover-deposit"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Deposit</p>
                      <p className="text-xs text-muted-foreground">Choose currency and network</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={selectedCrypto} onValueChange={handleSelectCrypto}>
                        <SelectTrigger className="liquid-glass border-white/10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                          {(["BTC", "LTC", "ETH", "ZCASH", "TON", "BNB"] as CryptoType[]).map((c) => (
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

                  <div className="space-y-2">
                    <Label>Deposit address</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={depositAddress} className="liquid-glass border-white/10 text-xs" />
                      <Button variant="secondary" className="liquid-glass border-0" onClick={copyDepositAddress} type="button">
                        {copiedDeposit ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(depositAddress)}`}
                        alt="Deposit QR"
                        className="w-24 h-24 rounded-lg border border-white/10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Scan to deposit. Ensure the network matches exactly to avoid loss of funds.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`0.00 ${selectedCrypto}`}
                      className="liquid-glass border-white/10"
                      inputMode="decimal"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Live price: {getSymbol()}{convert(cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 0).toFixed(2)}</p>
                    <p className="text-amber-400">Warning: Sending on the wrong network can result in permanent loss.</p>
                  </div>

                  {/* Deposit Confirmation Button */}
                  {!depositSubmitted ? (
                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={handleSubmitDeposit}
                      disabled={submitDepositMutation.isPending || !depositAmount || !depositAddress}
                      data-testid="button-confirm-deposit"
                    >
                      {submitDepositMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          I Have Completed My Deposit
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-400">Submitted!</p>
                          <p className="text-xs text-muted-foreground">We'll verify within 10-30 min.</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
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
            
            <Button
              data-testid="button-create-miner"
              onClick={onNavigateToMining}
              className="flex-1 liquid-glass border-0 bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center h-12 rounded-2xl"
              variant="ghost"
              type="button"
            >
              <Fan className="w-3 h-3" />
            </Button>

            <Popover open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <PopoverTrigger asChild>
                <Button
                  data-testid="button-withdraw"
                  onClick={openWithdraw}
                  className="flex-1 liquid-glass border-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center h-12 rounded-2xl"
                  variant="ghost"
                  type="button"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={10}
                className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(380px,calc(100vw-1.5rem))]"
                data-testid="popover-withdraw"
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Withdraw</p>
                    <p className="text-xs text-muted-foreground">Choose currency and network</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={selectedCrypto} onValueChange={handleSelectCrypto}>
                        <SelectTrigger className="liquid-glass border-white/10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                          {(["BTC", "LTC", "ETH", "ZCASH", "TON", "BNB"] as CryptoType[]).map((c) => (
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

                  <div className="space-y-2">
                    <Label>Recipient address</Label>
                    <Input
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="Paste address"
                      className="liquid-glass border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex gap-2">
                      <Input
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`0.00 ${selectedCrypto}`}
                        className="liquid-glass border-white/10 flex-1"
                        inputMode="decimal"
                      />
                      <Button
                        variant="secondary"
                        className="liquid-glass border-0"
                        type="button"
                        onClick={() => setWithdrawAmount(selectedBalance.toString())}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Balance: {selectedBalance.toFixed(6)} {selectedCrypto}</p>
                  </div>

                  <div className="text-xs text-amber-400">
                    Warning: Selecting the wrong blockchain network can lead to irreversible loss of funds. Double-check the network before confirming.
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" className="liquid-glass border-0" onClick={() => setWithdrawOpen(false)} type="button">
                      Cancel
                    </Button>
                    <Button
                      className="liquid-glass border-0 bg-primary/20 text-foreground"
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
          </div>
          
          <div className="flex gap-2 mt-2">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Deposit</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Create Miner</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Withdraw</p>
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
          <GlassCard delay={0.25} className="p-4 hover-elevate cursor-pointer" glow="primary" data-testid="card-hashrate">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground font-display" data-testid="text-hash-power">{miningPower}</p>
                <p className="text-xs text-muted-foreground">Hashrate</p>
              </div>
              <motion.img 
                src="https://cdn3d.iconscout.com/3d/premium/thumb/mining-algorithm-3d-icon-png-download-11264737.png"
                alt="Hashrate"
                className="w-[89px] h-[89px] object-contain"
                whileHover={{ scale: 1.05 }}
              />
            </div>
          </GlassCard>
        </div>

        <div onClick={onNavigateToMining} className="cursor-pointer">
          <GlassCard delay={0.3} className="p-4 hover-elevate cursor-pointer" glow="primary" data-testid="card-active-contracts">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground font-display" data-testid="text-active-contracts">{activeContracts}</p>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
              </div>
              <motion.img 
                src="https://cdn3d.iconscout.com/3d/premium/thumb/crypto-smart-contract-3d-icon-png-download-13394096.png"
                alt="Contracts"
                className="w-[94px] h-[94px] object-contain"
                whileHover={{ scale: 1.05 }}
              />
            </div>
          </GlassCard>
        </div>
      </motion.div>

      {/* Referral and Rate App Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 gap-3"
      >
        <Link href="/referral">
          <motion.div
            className="relative overflow-hidden rounded-2xl cursor-pointer hover-elevate h-40"
            whileTap={{ scale: 0.98 }}
            data-testid="card-invite-friend"
          >
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-slate-900/80 dark:to-slate-950 bg-gradient-to-br from-blue-100/80 via-slate-50/90 to-blue-50" />
            <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-30 opacity-20" viewBox="0 0 400 200">
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
              <img src="https://cdn3d.iconscout.com/3d/premium/thumb/user-referral-3d-icon-png-download-9801460.png" alt="Referral" className="w-16 h-16" />
              <p className="text-sm font-semibold text-foreground text-center px-3 leading-snug">
                Invite A Friend, Both Receive <span className="text-blue-400 font-bold">$5 In BTC</span>
              </p>
            </div>
          </motion.div>
        </Link>

        <motion.div
          className="relative overflow-hidden rounded-2xl h-40"
          data-testid="card-rate-app"
        >
          <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-amber-950/60 dark:via-slate-900/80 dark:to-slate-950 bg-gradient-to-br from-amber-100/80 via-slate-50/90 to-amber-50" />
          <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-30 opacity-20" viewBox="0 0 400 200">
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
                <img src="https://cdn3d.iconscout.com/3d/premium/thumb/5-star-3d-icon-png-download-10200199.png" alt="5 Stars" className="w-16 h-16" />
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
        <div className="grid grid-cols-2 gap-3">
          {balances.map((balance, index) => {
            const cryptoData = cryptoPrices[balance.symbol as keyof typeof cryptoPrices];
            const price = cryptoData?.price || 0;
            const change24h = cryptoData?.change24h || balance.change24h || 0;
            
            return (
              <GlassCard 
                key={balance.id}
                delay={0.53 + index * 0.05} 
                className="p-3"
                data-testid={`trending-crypto-${balance.symbol.toLowerCase()}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={
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
    </>
  );
}

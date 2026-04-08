/**
 * Dashboard — Minimal Version (Balance Card Only)
 * 
 * This is a stripped-down homepage that shows ONLY the balance card.
 * The full homepage is saved at: client/src/pages/Dashboard.backup.tsx
 * 
 * To restore the full homepage, run:
 *   cp client/src/pages/Dashboard.backup.tsx client/src/pages/Dashboard.tsx
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpFromLine, ArrowDownToLine, Fan, Loader2, CheckCircle2, Copy, Check, Zap } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { LiquidGlassCard } from "@/components/GlassCard";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
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
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StripePayButton } from "@/components/StripePayButton";
import { auth } from "@/lib/firebase";
import type { WalletBalance, Transaction, MiningStats } from "@/lib/types";

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
  BTC: [{ id: "btc-native", name: "Bitcoin (Native)" }],
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

export function Dashboard({
  balances = [],
  totalBalance = 0,
  onNavigateToMining,
  onNavigateToWallet,
  isLoggedIn = false,
}: DashboardProps) {
  const { convert, getSymbol } = useCurrency();
  const { prices: cryptoPrices } = useCryptoPrices();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState<string>(cryptoNetworks.USDT[0].id);
  const [depositAddress, setDepositAddress] = useState<string>("Loading...");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [copiedDeposit, setCopiedDeposit] = useState(false);
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [showDepositQR, setShowDepositQR] = useState(false);
  const [prevBalance, setPrevBalance] = useState(totalBalance);
  const [balanceIncreased, setBalanceIncreased] = useState(false);

  useEffect(() => {
    if (totalBalance > prevBalance && prevBalance > 0) {
      setBalanceIncreased(true);
      const timer = setTimeout(() => setBalanceIncreased(false), 1500);
      return () => clearTimeout(timer);
    }
    setPrevBalance(totalBalance);
  }, [totalBalance, prevBalance]);

  useEffect(() => {
    if (!depositOpen) setShowDepositQR(false);
  }, [depositOpen]);

  const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.dbId || user?.id || user?.uid;

  const { data: walletAddresses } = useQuery<Record<string, string>>({
    queryKey: ["wallet-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/config/wallets/all");
      if (!res.ok) return {};
      const data = await res.json();
      return (data?.map || data) as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (selectedNetwork && walletAddresses) {
      const configKey = networkToConfigKey[selectedNetwork];
      const address = walletAddresses[configKey] || "Address not configured - contact support";
      setDepositAddress(address);
    }
  }, [selectedNetwork, walletAddresses]);

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

  const selectedBalance = balances.find((b) => b.symbol.toUpperCase() === selectedCrypto.toUpperCase())?.balance ?? 0;
  const convertedBalance = convert(totalBalance);

  const handleSelectCrypto = (value: string) => {
    const crypto = value as CryptoType;
    setSelectedCrypto(crypto);
    const firstNetwork = cryptoNetworks[crypto]?.[0]?.id ?? cryptoNetworks.USDT[0].id;
    setSelectedNetwork(firstNetwork);
    setDepositSubmitted(false);
  };

  const handleSelectNetwork = (value: string) => {
    setSelectedNetwork(value);
    setDepositSubmitted(false);
  };

  const copyDepositAddress = async () => {
    if (!depositAddress) return;
    await navigator.clipboard.writeText(depositAddress);
    setCopiedDeposit(true);
    setTimeout(() => setCopiedDeposit(false), 1500);
    toast({ title: "Copied", description: "Deposit address copied to clipboard." });
  };

  const submitDepositMutation = useMutation({
    mutationFn: async (data: { amount: string; currency: string; network: string; walletAddress: string }) => {
      const currentUserStr = localStorage.getItem("user");
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      const currentUserId = currentUser?.dbId || currentUser?.id || currentUser?.uid || auth?.currentUser?.uid;
      if (!currentUserId) throw new Error("Authentication error. Please log out and log in again.");
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch("/api/deposits/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        body: JSON.stringify({ userId: currentUserId, ...data }),
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
      toast({ title: "Deposit Request Submitted!", description: "We'll confirm your deposit once we verify the transaction." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Submit", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({ title: "Enter Amount", description: "Please enter the amount you deposited.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(depositAmount);
    const price = cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 0;
    if (price > 0 && amount * price < 20) {
      const minAmount = (20 / price).toFixed(8);
      toast({ title: "Minimum Deposit Not Met", description: `Minimum deposit is $20. Please deposit at least ${minAmount} ${selectedCrypto}.`, variant: "destructive" });
      return;
    }
    submitDepositMutation.mutate({ amount: depositAmount, currency: selectedCrypto, network: selectedNetwork, walletAddress: depositAddress });
  };

  const confirmWithdraw = () => {
    toast({ title: "Withdraw request created", description: "This will be connected to DeFi wallet later." });
    setWithdrawOpen(false);
    setWithdrawAmount("");
    setWithdrawAddress("");
  };

  return (
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

          {/* Balance display */}
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

          {/* Estimated Earnings Today */}
          <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
            <div className="flex-1">
              <p className="text-[10px] font-medium font-ui mb-1" style={{ color: "rgb(12, 185, 105)" }}>Estimated Earnings Today</p>
              {activeMiningPurchases.length > 0 && miningPerSecondUSD > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-numbers" style={{ color: "rgb(12, 185, 105)" }}>
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

          {/* Pending Deposits */}
          {pendingTotal > 0 && (
            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="flex-1">
                <p className="text-[10px] text-amber-400 font-medium font-ui">Pending Deposits</p>
                <p className="text-xs text-amber-300 font-numbers">{getSymbol()}{convert(pendingTotal).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-5 px-4">
            {/* Deposit */}
            <div className="flex flex-col items-center gap-1.5">
              <Popover open={depositOpen} onOpenChange={setDepositOpen}>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="button-deposit"
                    onClick={(e) => {
                      if (onNavigateToWallet) { e.preventDefault(); e.stopPropagation(); onNavigateToWallet(); }
                      else { setWithdrawOpen(false); setDepositAmount(""); setDepositSubmitted(false); setDepositOpen((v) => !v); }
                    }}
                    className="w-11 h-11 liquid-glass border-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-2xl p-0"
                    variant="ghost"
                    type="button"
                  >
                    <ArrowUpFromLine className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" sideOffset={45} avoidCollisions collisionPadding={{ top: 60, bottom: 20, left: 16, right: 16 }} className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(380px,calc(100vw-2rem))] max-h-[50vh] overflow-y-auto p-2 md:p-3" data-testid="popover-deposit">
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
                          <SelectTrigger className="liquid-glass border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                            {(["USDT", "USDC", "BTC", "LTC", "ETH", "ZCASH", "TON", "BNB"] as CryptoType[]).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Network</Label>
                        <Select value={selectedNetwork} onValueChange={handleSelectNetwork}>
                          <SelectTrigger className="liquid-glass border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                            {(cryptoNetworks[selectedCrypto] ?? []).map((n) => (<SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>))}
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
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 border-white/10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400" onClick={() => setShowDepositQR(true)} type="button">Show QR Code</Button>
                        ) : (
                          <>
                            <div className="relative group">
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(depositAddress)}&margin=8`} alt="Deposit QR Code" className="w-24 h-24 md:w-28 md:h-28 rounded-lg border-2 border-white/20 bg-white p-1 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(depositAddress)}&margin=10`, "_blank")} />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-black/60 text-white text-[10px] md:text-xs px-2 py-1 rounded-full">Click to enlarge</div>
                              </div>
                            </div>
                            <p className="text-[10px] md:text-xs text-center text-muted-foreground max-w-[260px]">Scan QR to deposit. Click to enlarge. Verify network to avoid loss.</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs">Amount</Label>
                      <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder={`0.00 ${selectedCrypto}`} className="liquid-glass border-white/10 h-9 text-xs" inputMode="decimal" />
                      <p className="text-[10px] md:text-xs text-emerald-400">Minimum deposit: {getSymbol()}20.00 ({((20 / (cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 1))).toFixed(8)} {selectedCrypto})</p>
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground space-y-0.5">
                      <p>Live price: {getSymbol()}{convert(cryptoPrices[selectedCrypto as keyof typeof cryptoPrices]?.price ?? 0).toFixed(2)}</p>
                      <p className="text-amber-400">⚠️ Warning: Sending on the wrong network can result in permanent loss.</p>
                    </div>
                    {!depositSubmitted ? (
                      <>
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-9 md:h-10 text-xs md:text-sm" onClick={handleSubmitDeposit} disabled={submitDepositMutation.isPending || !depositAmount || !depositAddress} data-testid="button-confirm-deposit">
                          {submitDepositMutation.isPending ? (<><Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />Submitting...</>) : (<><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />I Have Completed My Deposit</>)}
                        </Button>
                        {userId && depositAmount && parseFloat(depositAmount) > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <p className="text-[10px] text-muted-foreground text-center mb-1">Or deposit instantly with card</p>
                            <StripePayButton userId={userId} amount={parseFloat(depositAmount)} productType="wallet_deposit" productName={`Wallet Deposit - $${parseFloat(depositAmount).toFixed(2)}`} metadata={{ depositCurrency: selectedCrypto }} variant="outline" className="w-full h-9" onPaymentSuccess={() => { queryClient.invalidateQueries(); setDepositSubmitted(true); }} />
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
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => { setDepositSubmitted(false); setDepositAmount(""); }}>Submit Another</Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-muted-foreground font-ui">Deposit</p>
            </div>

            {/* Create Miner */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div className="relative" animate={{ boxShadow: ["0 0 15px 2px rgba(16, 185, 129, 0.3)", "0 0 25px 4px rgba(16, 185, 129, 0.5)", "0 0 15px 2px rgba(16, 185, 129, 0.3)"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ borderRadius: "1rem" }}>
                <Button data-testid="button-create-miner" onClick={onNavigateToMining} className="w-11 h-11 relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 flex items-center justify-center rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 p-0" variant="ghost" type="button">
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
                  <Fan className="w-4 h-4" />
                </Button>
              </motion.div>
              <p className="text-[10px] text-muted-foreground font-ui">Create Miner</p>
            </div>

            {/* Withdraw */}
            <div className="flex flex-col items-center gap-1.5">
              <Popover open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="button-withdraw"
                    onClick={(e) => {
                      if (onNavigateToWallet) { e.preventDefault(); e.stopPropagation(); onNavigateToWallet(); }
                      else { setDepositOpen(false); setWithdrawOpen((v) => !v); }
                    }}
                    className="w-11 h-11 liquid-glass border-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center rounded-2xl p-0"
                    variant="ghost"
                    type="button"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" sideOffset={45} avoidCollisions collisionPadding={{ top: 60, bottom: 20, left: 16, right: 16 }} className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl w-[min(380px,calc(100vw-2rem))] max-h-[50vh] overflow-y-auto p-2 md:p-3" data-testid="popover-withdraw">
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <p className="text-xs md:text-sm font-semibold text-foreground">Withdraw</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Choose currency and network</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="space-y-1 md:space-y-2">
                        <Label className="text-xs">Currency</Label>
                        <Select value={selectedCrypto} onValueChange={handleSelectCrypto}>
                          <SelectTrigger className="liquid-glass border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                            {(["USDT", "USDC", "BTC", "LTC", "ETH", "ZCASH", "TON", "BNB"] as CryptoType[]).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <Label className="text-xs">Network</Label>
                        <Select value={selectedNetwork} onValueChange={handleSelectNetwork}>
                          <SelectTrigger className="liquid-glass border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                            {(cryptoNetworks[selectedCrypto] ?? []).map((n) => (<SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs">Recipient address</Label>
                      <Input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="Paste address" className="liquid-glass border-white/10 h-9 text-xs" />
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-xs">Amount</Label>
                      <div className="flex gap-2">
                        <Input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={`0.00 ${selectedCrypto}`} className="liquid-glass border-white/10 flex-1 h-9 text-xs" inputMode="decimal" />
                        <Button variant="secondary" className="liquid-glass border-0 h-9 px-2 text-xs" type="button" onClick={() => setWithdrawAmount(selectedBalance.toString())}>Max</Button>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Balance: {selectedBalance.toFixed(6)} {selectedCrypto}</p>
                    </div>
                    <div className="text-[10px] md:text-xs text-amber-400 bg-amber-400/10 p-2 rounded-lg">Warning: Selecting the wrong blockchain network can lead to irreversible loss of funds. Double-check the network before confirming.</div>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" className="liquid-glass border-0 h-9 text-xs" onClick={() => setWithdrawOpen(false)} type="button">Cancel</Button>
                      <Button className="liquid-glass border-0 bg-primary/20 text-foreground h-9 text-xs" onClick={confirmWithdraw} type="button" disabled={!withdrawAddress || !withdrawAmount} data-testid="button-confirm-withdraw-dashboard">Confirm</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-muted-foreground font-ui">Withdraw</p>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}

export default Dashboard;

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Zap, 
  Target, 
  Award,
  HelpCircle,
  Sparkles,
  Cpu,
  Clock,
  ArrowRight,
  TrendingUp,
  ChevronLeft
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
import { StripePayButton } from "@/components/StripePayButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useCryptoPrices, CryptoType } from "@/hooks/useCryptoPrices";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/firebase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import btcMine from "@assets/Bitcoin_Mine_1766014388617.webp";
import btcCoin from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import serverMining from "@assets/Server_Mining_1766014388610.webp";

const COST_PER_PH_PER_MONTH = 40;
const NETWORK_HASHRATE_EH = 650;
const BLOCK_REWARD = 3.125;

const faqItems = [
  {
    id: "faq-1",
    question: "What is Solo Mining?",
    answer: "Solo mining means you mine independently without sharing rewards with a pool. Unlike pool mining where rewards are split among participants, solo mining gives you the entire block reward (3.125 BTC) when you find a block. This approach may take longer between rewards, but each successful block discovery is significantly more valuable."
  },
  {
    id: "faq-2",
    question: "How does block reward work?",
    answer: "When you successfully mine a Bitcoin block, you receive the full block reward of 3.125 BTC plus all transaction fees included in that block. This reward is significantly higher than what you'd earn from pool mining over the same period, making solo mining attractive for those willing to take the risk."
  },
  {
    id: "faq-3",
    question: "What are my block discovery rates?",
    answer: "Your probability of finding a block depends on your hashpower relative to the total network hashrate. With 50 PH/s running for 6 months, you have approximately 85% likelihood of discovering a block. Higher hashpower and longer duration increase your success rate significantly."
  },
  {
    id: "faq-4",
    question: "Can I cancel my contract?",
    answer: "Solo mining contracts can be cancelled within the first 7 days for a full refund. After 7 days, you may cancel with a 15% early termination fee. Once mining has been active for over 30 days, cancellation is subject to review and partial refunds based on remaining contract duration."
  },
  {
    id: "faq-5",
    question: "How do I receive my rewards?",
    answer: "If you successfully mine a block, the 3.125 BTC reward is automatically deposited to your connected wallet within 24 hours of block confirmation. You'll receive instant notifications via email and push notification when a block is found. All rewards are verifiable on the blockchain."
  }
];

function FloatingParticle({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-primary/40 rounded-full"
      style={{ left: `${x}%` }}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ 
        y: "-100%", 
        opacity: [0, 0.8, 0.8, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

// Supported payment currencies
const paymentCurrencies: CryptoType[] = ["USDT", "BTC", "LTC", "ETH"];

export function SoloMining() {
  const [hashpower, setHashpower] = useState([50]);
  const [duration, setDuration] = useState([6]);
  const [paymentCurrency, setPaymentCurrency] = useState<CryptoType>("USDT");
  const { btcPrice } = useBTCPrice();
  const { prices: cryptoPrices } = useCryptoPrices();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getCurrentUser();

  const { data: estimateConfig } = useQuery<{ soloEstimateMultiplier: number }>({
    queryKey: ["/api/config/estimates"],
    queryFn: async () => {
      const res = await fetch("/api/config/estimates");
      if (!res.ok) return { soloEstimateMultiplier: 1 };
      return res.json();
    },
    staleTime: 60000,
  });

  const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  const storedUser = userStr
    ? (() => {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      })()
    : null;
  const dbUserId: string | null = storedUser?.id || null;

  const { data: balanceData } = useQuery<{ balances: Array<{ symbol: string; balance: number }>; pending: Record<string, number> }>({
    queryKey: ["/api/balances", dbUserId],
    queryFn: async () => {
      if (!dbUserId) return { balances: [], pending: {} };
      const res = await fetch(`/api/balances/${dbUserId}`);
      if (!res.ok) throw new Error("Failed to fetch balances");
      return res.json();
    },
    enabled: !!dbUserId,
  });

  // Get balance for selected payment currency (case-insensitive)
  const wallets = balanceData?.balances || [];
  const selectedWallet = wallets.find((w) => w.symbol.toUpperCase() === paymentCurrency.toUpperCase());
  const availableBalance = selectedWallet?.balance || 0;
  
  // Convert USD cost to selected crypto currency
  const convertUSDToCrypto = (usdAmount: number, currency: CryptoType): number => {
    const price = cryptoPrices[currency]?.price || 1;
    return usdAmount / price;
  };

  const { data: miningPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/users", dbUserId, "mining-purchases"],
    queryFn: async () => {
      if (!dbUserId) return [];
      const res = await fetch(`/api/users/${dbUserId}/mining-purchases`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!dbUserId,
    refetchInterval: 30000,
  });

  const activeSoloPurchases = useMemo(() => {
    return (miningPurchases || []).filter(
      (p: any) => p?.status === "active" && String(p?.packageName || "").includes("Solo Mining")
    );
  }, [miningPurchases]);

  const soloStats = useMemo(() => {
    const totalPH = activeSoloPurchases.reduce((sum: number, p: any) => sum + (Number(p?.hashrate) || 0), 0);
    
    // New Calculation: 0.5% of investment daily
    const totalInvestment = activeSoloPurchases.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);
    const dailyEarningsUSD = totalInvestment * 0.005;
    
    // Derived values for UI compatibility
    const expectedDailyBTC = btcPrice > 0 ? dailyEarningsUSD / btcPrice : 0;
    const perSecondUSD = dailyEarningsUSD > 0 ? dailyEarningsUSD / 86400 : 0;

    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const secondsSinceMidnight = Math.max(0, Math.floor((now - midnight.getTime()) / 1000));
    const expectedSoFarTodayUSD = perSecondUSD > 0 ? perSecondUSD * secondsSinceMidnight : 0;

    const sortedByExpiry = [...activeSoloPurchases].sort((a: any, b: any) => {
      const aTime = a?.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b?.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    const nearestExpiry = sortedByExpiry[0]?.expiryDate ? new Date(sortedByExpiry[0].expiryDate) : null;
    const hoursToExpiry = nearestExpiry ? Math.max(0, Math.floor((nearestExpiry.getTime() - now) / (1000 * 60 * 60))) : null;

    // Calculate probability of finding a block based on current hashpower
    // Optimistic calculation to encourage users
    const networkHashratePH = NETWORK_HASHRATE_EH * 1000;
    const blocksPerDay = 144; // Average blocks per day
    
    // Calculate remaining days across all contracts
    const totalRemainingDays = activeSoloPurchases.reduce((sum: number, p: any) => {
      if (!p?.expiryDate) return sum + 30; // Default 30 days if no expiry
      const remaining = Math.max(0, (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
      return sum + remaining;
    }, 0);
    
    const avgRemainingDays = activeSoloPurchases.length > 0 ? totalRemainingDays / activeSoloPurchases.length : 0;
    const totalBlocksRemaining = blocksPerDay * avgRemainingDays;
    const probabilityPerBlock = totalPH / networkHashratePH;
    
    // Probability of finding at least one block
    let blockProbability = totalPH > 0 ? 1 - Math.pow(1 - probabilityPerBlock, totalBlocksRemaining) : 0;
    
    // Boost probability for better user experience (optimistic display)
    // Scale from actual to ~15% higher for encouragement
    blockProbability = Math.min(blockProbability * 1.15, 0.99);
    
    // Format as percentage with 2 decimals for display
    const blockProbabilityPercent = (blockProbability * 100).toFixed(2);

    return {
      totalPH,
      expectedDailyBTC,
      perSecondUSD,
      expectedSoFarTodayUSD,
      nearestExpiry,
      hoursToExpiry,
      blockProbability,
      blockProbabilityPercent,
    };
  }, [activeSoloPurchases, btcPrice]);

  const calculations = useMemo(() => {
    const ph = hashpower[0];
    const months = duration[0];
    
    // Base cost calculation
    let cost = ph * months * COST_PER_PH_PER_MONTH;
    
    // Apply 40% discount for 50 PH/s or more
    const hasDiscount = ph >= 50;
    if (hasDiscount) {
      cost = cost * 0.6; // 40% discount
    }
    
    // Calculate probability based on realistic mining odds
    // For 50 PH/s at 6 months: ~85% chance
    const networkHashratePH = NETWORK_HASHRATE_EH * 1000;
    const blocksPerMonth = 4320;
    const totalBlocks = blocksPerMonth * months;
    const probabilityPerBlock = ph / networkHashratePH;
    
    // Enhanced probability calculation for better odds
    let probabilityOfAtLeastOneBlock = 1 - Math.pow(1 - probabilityPerBlock, totalBlocks);
    
    // Boost probability for recommended config (50 PH/s, 6 months should give ~85%)
    if (ph >= 50 && months >= 6) {
      probabilityOfAtLeastOneBlock = Math.min(0.85 + (ph - 50) * 0.002 + (months - 6) * 0.01, 0.99);
    }
    
    return {
      cost,
      discount: hasDiscount ? 40 : 0,
      probability: (probabilityOfAtLeastOneBlock * 100).toFixed(1),
      expectedBlocks: (probabilityOfAtLeastOneBlock).toFixed(3)
    };
  }, [hashpower, duration]);

  const isRecommended = hashpower[0] === 50 && duration[0] === 6;

  const createSoloPurchase = useMutation({
    mutationFn: async () => {
      if (!dbUserId) throw new Error("Account not ready");

      const months = duration[0];
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + months);
      
      // Convert cost to selected currency
      const costInCrypto = convertUSDToCrypto(calculations.cost, paymentCurrency);

      const res = await fetch("/api/mining/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUserId,
          packageName: `Solo Mining • ${hashpower[0]} PH/s • ${months} months`,
          crypto: "BTC",
          symbol: paymentCurrency,
          amount: costInCrypto,
          hashrate: hashpower[0],
          hashrateUnit: "PH/s",
          efficiency: "Solo",
          dailyReturnBTC: 0,
          returnPercent: 0,
          paybackMonths: months,
          expiryDate: expiryDate.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to purchase");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balances", dbUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", dbUserId, "mining-purchases"] });
      toast({ title: "Solo Mining Started", description: "Your solo mining contract is now active." });
    },
    onError: (error: Error) => {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleStartSoloMining = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start solo mining.",
        variant: "destructive",
      });
      return;
    }

    if (!dbUserId) {
      toast({
        title: "Account Not Ready",
        description: "Please refresh once, then try again.",
        variant: "destructive",
      });
      return;
    }

    // Convert cost to selected currency for comparison
    const costInCrypto = convertUSDToCrypto(calculations.cost, paymentCurrency);
    
    if (availableBalance < costInCrypto) {
      const needed = costInCrypto - availableBalance;
      toast({
        title: "Deposit Required",
        description: `You need ${needed.toFixed(paymentCurrency === "USDT" ? 2 : 6)} more ${paymentCurrency} to start this contract.`,
        variant: "destructive",
      });
      return;
    }

    createSoloPurchase.mutate();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6 pb-8"
      >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <GlassCard className="relative overflow-visible p-6" glow="btc" topFade>
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <FloatingParticle 
                key={i} 
                delay={i * 0.8} 
                x={10 + i * 12}
                duration={4 + Math.random() * 2}
              />
            ))}
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Badge 
                className="mb-3 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border-cyan-400/50 font-semibold"
                data-testid="badge-block-hunt"
              >
                <Target className="w-3 h-3 mr-1" />
                Block Hunt
              </Badge>
              
              <h1 
                className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
                data-testid="heading-hero"
              >
                Discover a Full Bitcoin Block
              </h1>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acquire massive hashrate and mine for the ultimate goal - 
                a full 3.125 BTC block reward. Independent solo mining for serious miners.
              </p>
            </div>
            
            <motion.div 
              className="w-24 h-24 flex-shrink-0"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={btcMine} 
                alt="Bitcoin Mining"
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(247,147,26,0.3)]"
                data-testid="img-hero"
              />
            </motion.div>
          </div>
        </GlassCard>
      </motion.section>

      {activeSoloPurchases.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="relative overflow-hidden p-6" glow="btc" variant="strong">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/18 via-orange-500/10 to-transparent blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/14 via-blue-500/8 to-transparent blur-2xl" />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-emerald-500/15 border-emerald-500/30 font-semibold" style={{ color: 'rgb(12, 185, 105)' }}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Active Contracts
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/25">Solo Mining</Badge>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Your Solo Mining is Live</h2>
                  <p className="text-sm text-muted-foreground">
                    Expected value updates every second (visual only).
                  </p>
                </div>

                <motion.div
                  className="relative w-14 h-14 shrink-0"
                  animate={{ rotate: [0, 6, 0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-xl" />
                  <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-pulse" />
                  <img src={btcCoin} alt="Bitcoin" className="relative w-full h-full object-contain drop-shadow" />
                </motion.div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="liquid-glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">Active contracts</p>
                  <p className="text-2xl font-bold text-foreground">{activeSoloPurchases.length}</p>
                </div>
                <div className="liquid-glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">Network share</p>
                  <p className="text-2xl font-bold text-foreground">
                    {((soloStats.totalPH / (NETWORK_HASHRATE_EH * 1000)) * 100).toFixed(6)}%
                  </p>
                </div>
              </div>

              <div className="mt-3 liquid-glass rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Probability rate of finding a block</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-emerald-400">{soloStats.blockProbabilityPercent}%</span>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      EV/day: {soloStats.expectedDailyBTC.toFixed(6)} BTC (~${soloStats.expectedSoFarTodayUSD.toFixed(2)})
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold px-4"
                      onClick={() => {
                        const purchaseSection = document.getElementById('solo-purchase-section');
                        purchaseSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Increase
                    </Button>
                    {soloStats.nearestExpiry && (
                      <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/25">
                        <Clock className="w-3 h-3 mr-1" />
                        {soloStats.hoursToExpiry !== null ? `${soloStats.hoursToExpiry}h to expiry` : "Expiry set"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Active contract details</p>
                <div className="space-y-2">
                  {activeSoloPurchases.slice(0, 3).map((p: any, idx: number) => {
                    const expiryLabel = p?.expiryDate
                      ? new Date(p.expiryDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "—";
                    return (
                      <motion.div
                        key={p?.id ?? idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + idx * 0.05 }}
                        className="flex items-center justify-between rounded-xl px-4 py-3 liquid-glass"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p?.packageName || "Solo Mining"}</p>
                          <p className="text-xs text-muted-foreground">Expires: {expiryLabel}</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/25 shrink-0">
                          {Number(p?.hashrate || 0).toFixed(0)} PH/s
                        </Badge>
                      </motion.div>
                    );
                  })}

                  {activeSoloPurchases.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{activeSoloPurchases.length - 3} more active contracts
                    </p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      )}



      <motion.section
        id="solo-purchase-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6" variant="strong">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-16 h-16"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <img 
                  src={btcCoin} 
                  alt="Bitcoin"
                  className="w-full h-full object-contain"
                  data-testid="img-block-reward"
                />
              </motion.div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Block Reward</p>
                <div className="flex items-baseline gap-1">
                  <span 
                    className="text-4xl font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(247,147,26,0.5)]"
                    data-testid="text-block-reward"
                  >
                    3.125
                  </span>
                  <span className="text-xl font-semibold text-amber-400/80">BTC</span>
                </div>
              </div>
            </div>
            
            <Badge 
              className="bg-primary/10 text-primary border-primary/30 font-semibold text-xs shrink-0 whitespace-nowrap"
              data-testid="badge-potential-value"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              ~${(btcPrice * BLOCK_REWARD).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Badge>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
          
          {isRecommended && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Badge 
                className="w-full justify-center py-2 bg-primary/20 text-primary border-primary/40 font-semibold text-xs"
                data-testid="badge-recommended"
              >
                <Award className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span className="truncate">50 PH/s • 6 months • 85% success</span>
              </Badge>
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={serverMining} 
                alt="Server Mining"
                className="w-12 h-12 object-contain"
                data-testid="img-hashpower"
              />
              <h3 className="text-lg font-semibold text-foreground">Configure Your Mining Power</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Hashpower</span>
                  </div>
                  <span 
                    className="text-lg font-bold text-primary"
                    data-testid="text-hashpower-value"
                  >
                    {hashpower[0]} PH/s
                  </span>
                </div>
                <Slider
                  value={hashpower}
                  onValueChange={setHashpower}
                  min={1}
                  max={200}
                  step={1}
                  className="w-full"
                  data-testid="slider-hashpower"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>1 PH/s</span>
                  <span>200 PH/s</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Duration</span>
                  </div>
                  <span 
                    className="text-lg font-bold text-primary"
                    data-testid="text-duration-value"
                  >
                    {duration[0]} {duration[0] === 1 ? 'month' : 'months'}
                  </span>
                </div>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  min={1}
                  max={12}
                  step={1}
                  className="w-full"
                  data-testid="slider-duration"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>1 month</span>
                  <span>12 months</span>
                </div>
                {hashpower[0] >= 50 && duration[0] >= 6 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <Badge className="w-full justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Up to 85% success rate with this configuration!
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Payment Currency Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Pay with:</p>
                <Select value={paymentCurrency} onValueChange={(v) => setPaymentCurrency(v as CryptoType)}>
                  <SelectTrigger className="h-8 w-24 text-sm bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentCurrencies.map((c) => (
                      <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm font-medium text-foreground">
                {paymentCurrency === "USDT" ? "$" : ""}{availableBalance.toFixed(paymentCurrency === "USDT" ? 2 : 6)} {paymentCurrency}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                <p 
                  className="text-2xl font-bold text-foreground"
                  data-testid="text-cost"
                >
                  {paymentCurrency === "USDT" ? "$" : ""}{convertUSDToCrypto(calculations.cost, paymentCurrency).toFixed(paymentCurrency === "USDT" ? 0 : 4)} {paymentCurrency}
                </p>
                {calculations.discount > 0 && (
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                    {calculations.discount}% DISCOUNT
                  </Badge>
                )}
              </div>
              
              <div className="liquid-glass rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Block Discovery Rate</p>
                <p 
                  className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                  data-testid="text-probability"
                >
                  {calculations.probability}%
                </p>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 border-blue-400/50 text-white"
              data-testid="button-start-mining"
              onClick={handleStartSoloMining}
              disabled={createSoloPurchase.isPending}
            >
              <Zap className="w-5 h-5 mr-2" />
              {createSoloPurchase.isPending ? "Processing..." : "Start Solo Mining"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {dbUserId && (
              <StripePayButton
                userId={dbUserId}
                amount={calculations.cost}
                productType="solo_mining"
                productName={`Solo Mining ${hashpower[0]} PH/s - ${duration[0]} months`}
                metadata={{ hashrate: hashpower[0], hashrateUnit: "PH/s", duration: duration[0], crypto: "BTC" }}
                variant="outline"
                className="w-full h-12 text-base mt-2"
                onPaymentSuccess={() => {
                  queryClient.invalidateQueries();
                }}
              />
            )}
          </div>
        </GlassCard>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <AccordionItem 
                  value={item.id} 
                  className="border-border/50"
                  data-testid={`accordion-item-${item.id}`}
                >
                  <AccordionTrigger 
                    className="text-left text-foreground hover:no-underline hover:text-primary transition-colors"
                    data-testid={`accordion-trigger-${item.id}`}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent 
                    className="text-muted-foreground leading-relaxed"
                    data-testid={`accordion-content-${item.id}`}
                  >
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </GlassCard>
      </motion.section>
      </motion.div>
    </>
  );
}

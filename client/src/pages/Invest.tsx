import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/firebase";
import { GlobalHeader } from "@/components/GlobalHeader";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap, 
  CheckCircle2,
  Calculator,
  Sparkles,
  ArrowRight,
  Wallet,
  Lock,
  Award,
  Timer,
  CalendarDays,
  Calendar,
  CalendarRange,
  HelpCircle,
  PiggyBank,
  AlertTriangle,
  ChevronLeft
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StripePayButton } from "@/components/StripePayButton";
import { trackPurchaseBegin, trackPurchaseComplete, trackDeposit } from "@/lib/analytics";

// Invest is USDT-only (stable, predictable returns)
const cryptoAssets = [
  {
    symbol: "USDT",
    name: "Tether",
    icon: "$",
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
  },
];

type DurationType = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const periodDaysByDuration: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

// Trust badges for marketing
const trustBadges = [
  { icon: Shield, label: "Secure Platform", description: "Bank-grade security", color: "text-emerald-400" },
  { icon: Lock, label: "Insured Funds", description: "Protected deposits", color: "text-blue-400" },
  { icon: Zap, label: "Instant Access", description: "Withdraw anytime", color: "text-amber-400" },
  { icon: Award, label: "19% APR", description: "Industry leading", color: "text-purple-400" },
];

// Partner logos (trust indicators) - well-known fund security services
const partnerLogos = [
  { name: "Ledger", icon: "🛡️" },
  { name: "Coinbase Custody", icon: "🔐" },
];

// FAQ items - Admin can override these from dashboard
const defaultFaqItems = [
  {
    question: "Why are your APR rates higher than Binance or other platforms?",
    answer: "Our competitive APR rates (up to 19%) are made possible through our optimized strategies and lower operational overhead. Unlike traditional platforms, we focus on generating consistent returns while maintaining strong security and transparency."
  },
  {
    question: "Are my savings safe? Can I withdraw anytime?",
    answer: "Your funds are protected with bank-grade encryption and cold storage solutions. Unlike traditional staking, we offer complete flexibility—you can withdraw your funds at any time with no penalties or lock-up periods. Your capital and earned interest are always accessible."
  },
  {
    question: "How are returns calculated and paid out?",
    answer: "Returns are calculated based on your selected plan duration. Daily plans earn 17.9% APR with payouts every 24 hours. Weekly plans earn 18.0% APR, monthly plans earn 18.25% APR, quarterly plans earn 18.70% APR, and yearly plans earn our maximum 19.25% APR. Interest is compounded and credited automatically to your wallet."
  },
  {
    question: "What cryptocurrencies can I deposit?",
    answer: "We currently support Tether (USDT) for our yield platform. This provides a stable, predictable earnings experience with no volatility risk, allowing you to focus on consistent returns with our competitive APR rates."
  },
  {
    question: "How does this differ from traditional staking?",
    answer: "Traditional staking often requires long lock-up periods and variable returns dependent on network conditions. Our yield platform offers competitive fixed APR rates with no lock-up requirements. You get the benefits of flexible income with complete control over your assets—the best of both worlds."
  },
  {
    question: "What is the minimum deposit amount?",
    answer: "The minimum deposit for USDT is $100. There is no maximum limit—deposit as much as you'd like to earn. All mining contracts are valid for 7 years from the purchase date."
  },
];

function TrustMarketingSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Main trust banner */}
      <GlassCard delay={0.1} className="relative overflow-visible">
        {/* Lottie animation background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <DotLottieReact
            src="https://lottie.host/fe692048-9401-4c6e-97f1-1d26fb93ddc3/fVCmWDAc9P.lottie"
            loop
            autoplay
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-lg font-bold text-emerald-400">Secure & Protected</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Your assets are protected by industry-leading security protocols
          </p>
        </div>
      </GlassCard>

      {/* Trust badges grid */}
      <div className="grid grid-cols-2 gap-3">
        {trustBadges.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <GlassCard className="p-3 text-center" variant="subtle" animate={false}>
              <badge.icon className={`w-6 h-6 mx-auto mb-1 ${badge.color}`} />
              <p className="text-xs font-medium text-foreground">{badge.label}</p>
              <p className="text-[10px] text-muted-foreground">{badge.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Partner logos */}
      <div className="flex items-center justify-center gap-4 py-3">
        <span className="text-xs text-muted-foreground">Secured by:</span>
        <div className="flex gap-4">
          {partnerLogos.map((partner) => (
            <div key={partner.name} className="flex items-center gap-1 text-muted-foreground">
              <span className="text-lg">{partner.icon}</span>
              <span className="text-xs hidden sm:inline">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function APRCalculator() {
  const { convert, getSymbol } = useCurrency();
  const [selectedCrypto] = useState(cryptoAssets[0]);
  const [selectedDuration, setSelectedDuration] = useState<DurationType>("yearly"); // Default to annual (yearly)
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  const storedUser = userStr ? (() => {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  })() : null;
  const dbUserId: string | null = storedUser?.id || null;

  const { data: estimateConfig } = useQuery<{ investAprAnnualPercent: number }>({
    queryKey: ["/api/config/estimates"],
    queryFn: async () => {
      const res = await fetch("/api/config/estimates");
      if (!res.ok) return { investAprAnnualPercent: 19 };
      return res.json();
    },
    staleTime: 60000,
  });

  const investAprAnnualPercent = Number(estimateConfig?.investAprAnnualPercent ?? 19);

  const aprRates = useMemo(() => {
    const rate = Number.isFinite(investAprAnnualPercent) ? investAprAnnualPercent : 19;
    return {
      daily: { rate, label: "Daily", period: 1, icon: Timer },
      weekly: { rate, label: "Weekly", period: 7, icon: CalendarDays },
      monthly: { rate, label: "Monthly", period: 30, icon: Calendar },
      quarterly: { rate, label: "Quarterly", period: 90, icon: CalendarRange },
      yearly: { rate, label: "Yearly", period: 365, icon: CalendarRange },
    } as const;
  }, [investAprAnnualPercent]);

  // Fetch earn plans so we can use a real planId (required by FK)
  const { data: earnPlans = [] } = useQuery<Array<{ id: string; symbol: string }>>({
    queryKey: ["/api/earn-plans"],
    queryFn: async () => {
      const response = await fetch("/api/earn-plans");
      if (!response.ok) throw new Error("Failed to fetch earn plans");
      return response.json();
    },
  });

  const usdtPlanId = useMemo(() => {
    const plan = earnPlans.find((p) => p.symbol === "USDT");
    return plan?.id || null;
  }, [earnPlans]);

  // Fetch user's wallet balance
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balances", dbUserId],
    queryFn: async () => {
      if (!dbUserId) return { balances: [], pending: {} };
      const response = await fetch(`/api/balances/${dbUserId}`);
      if (!response.ok) throw new Error("Failed to fetch balances");
      return response.json();
    },
    enabled: !!dbUserId,
  });
  
  const wallets = balanceData?.balances || [];

  // Create earn subscription mutation
  const createSubscription = useMutation({
    mutationFn: async () => {
      if (!dbUserId) throw new Error("Not authenticated");

      if (!usdtPlanId) {
        throw new Error("USDT earn plan is not configured yet");
      }
      
      const response = await fetch("/api/earn/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: dbUserId,
          planId: usdtPlanId,
          amount: investmentAmount,
          symbol: "USDT",
          durationType: selectedDuration,
          aprRate: aprRates[selectedDuration].rate,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create investment");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balances", dbUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/earn-subscriptions", dbUserId] });
      trackPurchaseComplete(data?.id ?? 'earn', `USDT Earn ${selectedDuration}`, 'USD', investmentAmount);
      toast({
        title: "Savings Created!",
        description: `Successfully deposited ${getSymbol()}${convert(investmentAmount).toFixed(2)} in USDT`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartEarning = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start earning.",
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

    // Check if user has sufficient balance
    const wallet = wallets?.find((w: any) => w.symbol === "USDT");
    if (!wallet || wallet.balance < investmentAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${getSymbol()}${convert(investmentAmount).toFixed(2)} in your USDT wallet to start earning.`,
        variant: "destructive",
      });
      return;
    }

    createSubscription.mutate();
  };

  // Fetch admin-configured APR rates
  const { data: adminRates } = useQuery<typeof aprRates>({
    queryKey: ["/api/earn-rates"],
    staleTime: 60000,
  });

  // Use admin rates if available, otherwise use defaults
  const currentRates = adminRates && Object.keys(adminRates).length > 0 ? adminRates : aprRates;

  const calculatedReturns = useMemo(() => {
    const rateData = currentRates[selectedDuration];
    const annualRate = rateData.rate / 100; // This is the annual rate (e.g., 18.25% for monthly)
    const period = rateData.period;
    
    // Calculate total return after the period using the annual rate
    // Total = Principal + (Principal * AnnualRate * (Days/365))
    const totalAfterPeriod = investmentAmount * (1 + (annualRate * period / 365));
    const periodReturn = totalAfterPeriod - investmentAmount;
    
    // Daily earning is the period return divided by the number of days
    const dailyEarning = periodReturn / period;
    
    return {
      periodReturn,
      annualReturn: investmentAmount * annualRate,
      total: totalAfterPeriod,
      dailyEarning,
    };
  }, [investmentAmount, selectedDuration, currentRates]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <GlassCard className="p-6" variant="strong">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <i className="fi fi-tr-calculator" style={{ fontSize: 24, lineHeight: 1, color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Yield Calculator</h2>
            <p className="text-sm text-muted-foreground">Calculate your potential earnings</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* USDT-only */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${selectedCrypto.bgColor} flex items-center justify-center`}>
                <span className={`text-xl font-bold ${selectedCrypto.textColor}`}>{selectedCrypto.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">USD Savings</p>
                <p className="text-xs text-muted-foreground">Available balance updates in real-time</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Available USDT</p>
              <p className="font-bold text-foreground">
                {wallets?.find((w: any) => w.symbol === "USDT")?.balance?.toFixed?.(2) ?? "0.00"}
              </p>
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Savings Duration</Label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(aprRates).map(([key, value]) => {
                const DurationIcon = value.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDuration(key as keyof typeof aprRates)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      selectedDuration === key
                        ? "border-primary text-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    data-testid={`btn-duration-${key}`}
                  >
                    <DurationIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{value.label}</span>
                    <span className={`text-[10px] ${selectedDuration === key ? "text-primary" : "text-muted-foreground"}`}>
                      {value.rate}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Balance Display */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Available Balance in {selectedCrypto.symbol}</span>
                <p className="text-2xl font-bold text-foreground">
                  {wallets?.find((w: any) => w.symbol === selectedCrypto.symbol)?.balance?.toFixed(2) || "0.00"} {selectedCrypto.symbol}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInvestmentAmount(Math.floor((wallets?.find((w: any) => w.symbol === selectedCrypto.symbol)?.balance || 0)))}
                className="h-8"
              >
                Max
              </Button>
            </div>
            {wallets && wallets.find((w: any) => w.symbol === selectedCrypto.symbol) && 
              wallets.find((w: any) => w.symbol === selectedCrypto.symbol).balance < 50 && (
              <p className="text-xs text-amber-400 mt-2">⚠️ Minimum deposit is {getSymbol()}50</p>
            )}
          </div>

          {/* Deposit Amount Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm text-muted-foreground">Deposit Amount</Label>
              <span className={`text-2xl font-bold ${selectedCrypto.textColor}`} data-testid="text-investment-amount">
                {getSymbol()}{convert(investmentAmount).toLocaleString()}
              </span>
            </div>
            <Slider
              value={[investmentAmount]}
              onValueChange={(v) => setInvestmentAmount(v[0])}
              min={50}
              max={Math.floor(wallets?.find((w: any) => w.symbol === selectedCrypto.symbol)?.balance || 100000)}
              step={50}
              className="py-2"
              data-testid="slider-investment"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{getSymbol()}50</span>
              <span>{getSymbol()}{convert(Math.floor(wallets?.find((w: any) => w.symbol === selectedCrypto.symbol)?.balance || 100000)).toLocaleString()}</span>
            </div>
          </div>

          {/* Results Display */}
          <div className="p-5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">APR Rate</span>
              <span className={`text-2xl font-bold bg-gradient-to-r ${selectedCrypto.color} bg-clip-text text-transparent`} data-testid="text-apr-rate">
                {aprRates[selectedDuration].rate}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Daily Earnings</span>
                <p className="text-lg font-bold text-emerald-400" data-testid="text-daily-earnings">
                  +{getSymbol()}{convert(calculatedReturns.dailyEarning).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">{aprRates[selectedDuration].label} Return</span>
                <p className="text-lg font-bold text-emerald-400" data-testid="text-period-return">
                  +{getSymbol()}{convert(calculatedReturns.periodReturn).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-4">
              <span className="text-xs text-muted-foreground block mb-1">Total After {aprRates[selectedDuration].label} Period</span>
              <p className={`text-3xl font-bold bg-gradient-to-r ${selectedCrypto.color} bg-clip-text text-transparent`} data-testid="text-total-return">
                {getSymbol()}{convert(calculatedReturns.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Principal Protection Disclaimer */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-400 leading-relaxed">
                <strong>Principal Protection:</strong> Your initial deposit is fully returned after the period ends. 
                Unlike cloud mining, this works like bank deposits or stock yields - you keep your principal and earn returns on top.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleStartEarning}
            disabled={createSubscription.isPending}
            className={`w-full bg-gradient-to-r ${selectedCrypto.color} text-white border-0 h-12 text-base`}
            size="lg"
            data-testid="btn-start-earning"
          >
            {createSubscription.isPending ? "Processing..." : `Start Earning with ${selectedCrypto.symbol}`}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {dbUserId && (
            <StripePayButton
              userId={dbUserId}
              amount={investmentAmount}
              productType="earn_plan"
              productName={`${selectedCrypto.symbol} Earn Plan (${selectedDuration})`}
              metadata={{ duration: selectedDuration, aprRate: aprRates[selectedDuration]?.rate, symbol: selectedCrypto.symbol }}
              variant="outline"
              className="w-full h-12 text-base"
              onPaymentSuccess={() => {
                queryClient.invalidateQueries();
              }}
            />
          )}

          <p className="text-center text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 inline mr-1" />
            Withdraw your funds anytime with no penalties
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function CryptoYieldCard({ crypto, index }: { crypto: typeof cryptoAssets[0]; index: number }) {
  // Local APR rates for display
  const displayRates = [
    { label: "Daily", rate: "19.25" },
    { label: "Weekly", rate: "19.25" },
    { label: "Monthly", rate: "19.25" },
    { label: "Yearly", rate: "19.25" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <GlassCard 
        className="relative overflow-hidden" 
        animate={false}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${crypto.color} opacity-5`} />
        
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${crypto.bgColor} flex items-center justify-center`}>
                <span className={`text-2xl font-bold ${crypto.textColor}`}>{crypto.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{crypto.name}</h3>
                <span className="text-sm text-muted-foreground">{crypto.symbol}</span>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${crypto.bgColor} ${crypto.textColor} border-0`}>
                <Sparkles className="w-3 h-3 mr-1" />
                Up to 19.25% APR
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            {displayRates.map((item) => (
              <div key={item.label} className="text-center p-2">
                <span className="text-[10px] text-muted-foreground block">{item.label}</span>
                <span className={`text-sm font-bold ${crypto.textColor}`}>{item.rate}%</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>No lock-up • Instant withdrawals</span>
            </div>
            <Button 
              size="sm"
              className={`bg-gradient-to-r ${crypto.color} text-white border-0`}
              data-testid={`btn-invest-${crypto.symbol.toLowerCase()}`}
            >
              Invest
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ActiveInvestments() {
  const { convert, getSymbol } = useCurrency();
  const currentUser = getCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [selectedWithdrawSub, setSelectedWithdrawSub] = useState<any>(null);

  const { data: estimateConfig } = useQuery<{ investAprAnnualPercent: number }>({
    queryKey: ["/api/config/estimates"],
    queryFn: async () => {
      const res = await fetch("/api/config/estimates");
      if (!res.ok) return { investAprAnnualPercent: 19 };
      return res.json();
    },
    staleTime: 60000,
  });

  const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
  const storedUser = userStr ? (() => {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  })() : null;
  const dbUserId: string | null = storedUser?.id || null;

  // Fetch user's active earn subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["/api/users/earn-subscriptions", dbUserId],
    queryFn: async () => {
      if (!dbUserId) return [];
      const response = await fetch(`/api/users/${dbUserId}/earn-subscriptions`);
      if (!response.ok) throw new Error("Failed to fetch investments");
      return response.json();
    },
    enabled: !!dbUserId,
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/earn/withdraw/${subscriptionId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to withdraw");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/earn-subscriptions", dbUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/balances", dbUserId] });
      toast({
        title: "Withdrawal Successful",
        description: "Funds have been returned to your wallet.",
      });
    },
    onError: () => {
      toast({
        title: "Withdrawal Failed",
        description: "Unable to process withdrawal.",
        variant: "destructive",
      });
    },
  });

  const activeInvestments = subscriptions?.filter((s: any) => s.status === "active") || [];

  if (isLoading || activeInvestments.length === 0) {
    return null;
  }

  const secondsSinceMidnight = (() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((Date.now() - midnight.getTime()) / 1000));
  })();

  const investAprAnnualPercent = Number(estimateConfig?.investAprAnnualPercent ?? 19);

  const totals = activeInvestments.reduce(
    (acc: { principal: number; perSecond: number }, sub: any) => {
      const amount = Number(sub?.amount) || 0;
      const apr = Number(sub?.aprRate) || (Number.isFinite(investAprAnnualPercent) ? investAprAnnualPercent : 19);
      const periodDays = periodDaysByDuration[String(sub?.durationType || "yearly")] ?? 365;

      // Explicitly compute total return over the selected period using annual APR,
      // then derive "earnings today" from that period (as requested).
      const totalReturnForPeriod = amount * (apr / 100) * (periodDays / 365);
      const perDay = periodDays > 0 ? totalReturnForPeriod / periodDays : 0;
      const perSecond = perDay / 86400;

      return {
        principal: acc.principal + amount,
        perSecond: acc.perSecond + perSecond,
      };
    },
    { principal: 0, perSecond: 0 }
  );

  const earnedSoFarToday = totals.perSecond * secondsSinceMidnight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      <GlassCard className="relative overflow-hidden p-6" glow="btc" variant="strong" animate={false}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/18 via-teal-500/10 to-transparent blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/12 via-cyan-500/10 to-transparent blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-500/15 border-emerald-500/30 font-semibold" style={{ color: 'rgb(12, 185, 105)' }}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active Investment
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/25">USDT</Badge>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Your yield is live</h2>
              <p className="text-sm text-muted-foreground">Estimate updates every second (visual only).</p>
            </div>

            <motion.div
              className="w-10 h-10 rounded-full border border-emerald-400/30 bg-emerald-400/10 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0.0)", "0 0 26px rgba(16,185,129,0.25)", "0 0 0px rgba(16,185,129,0.0)"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'rgb(12, 185, 105)' }} />
            </motion.div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="liquid-glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Total invested</p>
              <p className="text-2xl font-bold text-foreground">{getSymbol()}{convert(totals.principal).toFixed(2)}</p>
            </div>
            <div className="liquid-glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Estimated earnings today</p>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{getSymbol()}</span>
                <LiveGrowingBalance
                  value={convert(earnedSoFarToday)}
                  perSecond={convert(totals.perSecond)}
                  active={totals.perSecond > 0}
                  decimals={2}
                  className="text-2xl font-bold text-foreground"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Based on {Number.isFinite(investAprAnnualPercent) ? investAprAnnualPercent : 19}% annual rate
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {activeInvestments.map((sub: any, index: number) => {
        const crypto = cryptoAssets.find(c => c.symbol === sub.symbol) || cryptoAssets[0];
        const periodDays = periodDaysByDuration[String(sub?.durationType || "yearly")] ?? 365;
        const totalReturnForPeriod = (sub.amount * (sub.aprRate / 100)) * (periodDays / 365);
        const dailyReturn = periodDays > 0 ? totalReturnForPeriod / periodDays : 0;
        const annualReturn = sub.amount * (sub.aprRate / 100);
        
        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <GlassCard className="p-4" animate={false} variant="subtle">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${crypto.bgColor} flex items-center justify-center`}>
                    <span className={`text-xl font-bold ${crypto.textColor}`}>{crypto.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{crypto.name}</h3>
                    <span className="text-xs text-muted-foreground capitalize">{sub.durationType} Plan</span>
                  </div>
                </div>
                <Badge className={`${crypto.bgColor} ${crypto.textColor} border-0`}>
                  {sub.aprRate}% APR
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Investment</span>
                  <p className="text-sm font-bold text-foreground">
                    {getSymbol()}{convert(sub.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Daily Return</span>
                  <p className="text-sm font-bold text-emerald-400">
                    +{getSymbol()}{convert(dailyReturn).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Annual Return</span>
                  <p className="text-sm font-bold text-emerald-400">
                    +{getSymbol()}{convert(annualReturn).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Earned</span>
                  <p className="text-sm font-bold text-emerald-400">
                    +{getSymbol()}{convert(sub.totalEarned || 0).toFixed(2)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedWithdrawSub(sub);
                    setWithdrawConfirmOpen(true);
                  }}
                  disabled={withdrawMutation.isPending}
                  className="text-xs"
                >
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={withdrawConfirmOpen} onOpenChange={setWithdrawConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Confirm Early Withdrawal
            </DialogTitle>
            <DialogDescription>
              Please review the withdrawal terms before proceeding
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawSub && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-400">Important Notice</p>
                    <p className="text-xs text-muted-foreground">
                      Withdrawing before your savings period ends means you will{" "}
                      <span className="text-amber-400 font-medium">not receive the full expected returns</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Investment:</span>
                  <span className="font-medium">{getSymbol()}{convert(selectedWithdrawSub.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Earned So Far:</span>
                  <span className="font-medium text-emerald-400">+{getSymbol()}{convert(selectedWithdrawSub.totalEarned || 0).toFixed(2)}</span>
                </div>
                {(selectedWithdrawSub.totalEarned || 0) > 0 && (
                  <div className="flex justify-between text-sm border-t border-border/30 pt-3">
                    <span className="text-muted-foreground">Profit Deduction:</span>
                    <span className="font-medium text-red-400">-{getSymbol()}{convert(selectedWithdrawSub.totalEarned || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-border/30 pt-3">
                  <span className="text-muted-foreground font-medium">You Will Receive:</span>
                  <span className="font-bold text-foreground">
                    {getSymbol()}{convert(selectedWithdrawSub.amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  <strong>Note:</strong> Your original principal will be returned to your wallet. Any earned profits 
                  will be deducted since the investment period has not completed.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWithdrawConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedWithdrawSub) {
                  withdrawMutation.mutate(selectedWithdrawSub.id);
                  setWithdrawConfirmOpen(false);
                  setSelectedWithdrawSub(null);
                }
              }}
              disabled={withdrawMutation.isPending}
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function FAQSection() {
  // Fetch admin-configured FAQs if available
  const { data: adminFaqs } = useQuery<Array<{ question: string; answer: string }>>({
    queryKey: ["/api/content/earn-faqs"],
    staleTime: 60000,
  });

  const faqItems: Array<{ question: string; answer: string }> =
    adminFaqs && adminFaqs.length > 0 ? adminFaqs : defaultFaqItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqItems.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border border-border/50 rounded-lg px-4"
          >
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4 text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 text-left">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}

interface InvestProps {
  onNavigateToHome?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToInvest?: () => void;
  onOpenSettings?: () => void;
}

export function Invest({ onNavigateToHome, onNavigateToWallet, onNavigateToInvest, onOpenSettings }: InvestProps = {}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6 pb-6"
        data-testid="page-invest"
      >

      {/* Hero Section */}
      <motion.div 
        className="text-center py-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 bg-clip-text text-transparent mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          data-testid="text-headline-apr"
        >
          Up to 19% APR
        </motion.div>
        
        <div className="flex items-center justify-center gap-3">
          <Badge 
            variant="outline" 
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            No Lock-up Period
          </Badge>
          <Badge 
            variant="outline" 
            className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3 py-1"
          >
            <Zap className="w-3 h-3 mr-1" />
            Instant Withdrawals
          </Badge>
        </div>
      </motion.div>

      {/* Active Investments (top priority) */}
      <ActiveInvestments />

      {/* Trust & Marketing Section */}
      <TrustMarketingSection />

      {/* APR Calculator Card */}
      <APRCalculator />

      {/* Key Features */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Why Choose Our Yield Platform?
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Fully Insured</p>
              <p className="text-xs text-muted-foreground">Assets fully protected</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Cold Storage</p>
              <p className="text-xs text-muted-foreground">Enterprise security</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Flexible Terms</p>
              <p className="text-xs text-muted-foreground">No lock-up required</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Fixed APR</p>
              <p className="text-xs text-muted-foreground">Predictable returns</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* FAQ Section */}
      <FAQSection />

      {/* Risk Disclosure - App Store Compliance */}
      <GlassCard className="p-4 border-amber-500/20" variant="subtle">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-amber-400">Risk Disclosure</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cryptocurrency investments involve significant risk. Past performance does not guarantee future results. 
              The projected returns shown are estimates only and may not be achieved. You could lose some or all of 
              your investment. This is not financial advice. Please consult a qualified financial advisor and conduct 
              your own research before making any investment decisions. BlockMint is not responsible for any financial 
              losses incurred through the use of this platform.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Bottom CTA */}
      <GlassCard className="p-6 text-center" variant="strong">
        <h3 className="text-lg font-bold text-foreground mb-2">Ready to Start Earning?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Join thousands of users growing their assets with our industry-leading APR rates.
        </p>
        <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
          <Wallet className="w-5 h-5 mr-2" />
          Deposit & Earn Now
        </Button>
      </GlassCard>
      </motion.div>
    </>
  );
}

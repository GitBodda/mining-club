import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { HashRateChart } from "@/components/HashRateChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/firebase";
import { 
  Wifi, 
  Clock, 
  Zap, 
  TrendingUp, 
  Server, 
  AlertCircle,
  Shield,
  CheckCircle2,
  Calculator,
  Sparkles,
  ArrowRight,
  Cpu,
  Flame,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Wallet
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useCryptoPrices, CryptoType } from "@/hooks/useCryptoPrices";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
import { StripePayButton } from "@/components/StripePayButton";
import type { ChartDataPoint, MiningContract, PoolStatus } from "@/lib/types";

import btcMineImg from "@assets/Bitcoin_Mine_1766014388617.webp";
import ltcMineImg from "@assets/Gemini_Generated_Image_1ri2av1ri2av1ri2_(1)_1766014388604.webp";
import btcProImg from "@assets/Bitcoin Depository.png";
import btcPremiumPlusImg from "@assets/PremiumPlus.png";
import ltcMiningCart from "@assets/Gemini_Generated_Image_46ieyx46ieyx46ie_(1)_1766014388603.webp";

interface MiningProps {
  chartData: ChartDataPoint[];
  contracts: MiningContract[];
  poolStatus: PoolStatus;
  onNavigateToInvest: () => void;
}

const mockPoolStatus: PoolStatus = {
  connected: true,
  poolName: "CryptoPool Pro",
  hashRate: "976.5 TH/s",
  uptime: 99.98,
  workers: 2,
};

// Mining packages (hashrate plans)
interface MiningPackage {
  id: string;
  name: string;
  crypto: "BTC" | "LTC";
  cost: number;
  hashrate: string;
  hashrateValue: number;
  hashrateUnit: string;
  duration: number;
  returnPercent: number;
  dailyReturnBTC: number;
  paybackMonths: number;
  efficiency: string;
  image: string;
  popular?: boolean;
}

const miningPackages: MiningPackage[] = [
  {
    id: "btc-pro",
    name: "Pro",
    crypto: "BTC",
    cost: 169.99,
    hashrate: "6 TH/s",
    hashrateValue: 6,
    hashrateUnit: "TH/s",
    duration: 0, // One-time
    returnPercent: 125,
    dailyReturnBTC: 0.00000630,
    paybackMonths: 13,
    efficiency: "15W/TH",
    image: btcProImg,
  },
  {
    id: "btc-premium",
    name: "Premium",
    crypto: "BTC",
    cost: 349.99,
    hashrate: "14 TH/s",
    hashrateValue: 14,
    hashrateUnit: "TH/s",
    duration: 0, // One-time
    returnPercent: 145,
    dailyReturnBTC: 0.00001470,
    paybackMonths: 11,
    efficiency: "15W/TH",
    image: btcMineImg,
    popular: true,
  },
  {
    id: "btc-premium-plus",
    name: "Premium+",
    crypto: "BTC",
    cost: 699.99,
    hashrate: "30 TH/s",
    hashrateValue: 30,
    hashrateUnit: "TH/s",
    duration: 0, // One-time
    returnPercent: 155,
    dailyReturnBTC: 0.00003800,
    paybackMonths: 10,
    efficiency: "15W/TH",
    image: btcPremiumPlusImg,
  },
];

const trustBadges = [
  { icon: Clock, label: "24/7 Mining", description: "Non-stop operation" },
  { icon: Shield, label: "Transparent Returns", description: "Clear profit tracking" },
  { icon: Zap, label: "Instant Withdrawals", description: "Get paid fast" },
  { icon: CheckCircle2, label: "Secure & Verified", description: "Enterprise security" },
];

function AnimatedHashrateDisplay({ value, unit }: { value: number; unit: string }) {
  return (
    <motion.div
      className="flex items-baseline gap-2"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        className="text-3xl font-bold text-foreground"
        data-testid="text-total-hashrate"
        animate={{ 
          textShadow: [
            "0 0 10px rgba(247, 147, 26, 0.3)",
            "0 0 20px rgba(247, 147, 26, 0.5)",
            "0 0 10px rgba(247, 147, 26, 0.3)",
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {value.toFixed(1)}
      </motion.span>
      <span className="text-base text-muted-foreground">{unit}</span>
    </motion.div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          initial={{ 
            x: Math.random() * 100 + "%",
            y: "100%",
            opacity: 0 
          }}
          animate={{ 
            y: "-10%",
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function ContractCard({ contract, index }: { contract: MiningContract; index: number }) {
  const isBTC = contract.cryptoType === "BTC";
  const progressPercent = ((contract.totalDays - contract.daysRemaining) / contract.totalDays) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
      data-testid={`card-contract-${contract.id}`}
    >
      <GlassCard 
        animate={false} 
        glow={isBTC ? "btc" : "ltc"}
        className="relative"
      >
        <FloatingParticles />
        
        <div className="flex items-start gap-4">
          <motion.div 
            className="relative w-14 h-14 flex-shrink-0"
            animate={{ 
              y: [0, -3, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <img 
              src={isBTC ? btcMineImg : ltcMineImg} 
              alt={`${contract.cryptoType} Mining`}
              className="w-full h-full object-contain drop-shadow-lg"
              data-testid={`img-contract-${contract.cryptoType.toLowerCase()}`}
            />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-foreground text-sm" data-testid={`text-contract-type-${contract.id}`}>
                {contract.cryptoType} Mining
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${isBTC ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}
                data-testid={`badge-contract-status-${contract.id}`}
              >
                Active
              </Badge>
            </div>
            
            <div className="text-xl font-bold text-foreground" data-testid={`text-contract-hashrate-${contract.id}`}>
              {contract.hashrate} {contract.hashrateUnit}
            </div>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Clock className="w-3 h-3" />
              Days Remaining
            </span>
            <span className="font-medium text-foreground text-xs" data-testid={`text-days-remaining-${contract.id}`}>
              {contract.daysRemaining} / {contract.totalDays}
            </span>
          </div>
          
          <Progress value={progressPercent} className="h-1" />
          
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="liquid-glass-subtle rounded-lg p-2">
              <div className="text-[10px] text-muted-foreground mb-0.5">Earned So Far</div>
              <div className="font-semibold text-foreground text-sm" data-testid={`text-earned-${contract.id}`}>
                {contract.earnedSoFar.toFixed(isBTC ? 5 : 3)} {contract.cryptoType}
              </div>
            </div>
            <div className="liquid-glass-subtle rounded-lg p-2">
              <div className="text-[10px] text-muted-foreground mb-0.5">Daily Rate</div>
              <div className="font-semibold text-emerald-400 text-sm" data-testid={`text-daily-rate-${contract.id}`}>
                +{contract.dailyEarningRate.toFixed(isBTC ? 6 : 4)} {contract.cryptoType}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function PoolStatusCard({ status }: { status: PoolStatus }) {
  return (
    <GlassCard delay={0.25}>
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Pool Status</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.connected ? "bg-emerald-400" : "bg-red-400"}`}>
            {status.connected && (
              <motion.div
                className="w-full h-full rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Status</div>
            <div className="font-medium text-foreground text-xs" data-testid="text-pool-status">
              {status.connected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-primary" />
          <div>
            <div className="text-[10px] text-muted-foreground">Pool Hash Rate</div>
            <div className="font-medium text-foreground text-xs" data-testid="text-pool-hashrate">
              {status.hashRate}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <div>
            <div className="text-[10px] text-muted-foreground">Uptime</div>
            <div className="font-medium text-foreground text-xs" data-testid="text-pool-uptime">
              {status.uptime}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Wifi className="w-3 h-3 text-muted-foreground" />
          <div>
            <div className="text-[10px] text-muted-foreground">Active Workers</div>
            <div className="font-medium text-foreground text-xs" data-testid="text-pool-workers">
              {status.workers}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Active Mining Purchases Component
function ActiveMiningPurchases({ 
  purchases, 
  btcPrice 
}: { 
  purchases: any[]; 
  btcPrice: number;
}) {
  const { convert, getSymbol } = useCurrency();
  const [showAll, setShowAll] = useState(false);
  
  if (!purchases || purchases.length === 0) return null;

  // Filter out solo mining purchases - they should only appear on Solo Mining page
  const activePurchases = purchases.filter((p) => 
    p.status === "active" && !String(p?.packageName || "").includes("Solo Mining")
  );
  
  if (activePurchases.length === 0) return null;

  // Show only first 2 unless expanded
  const displayedPurchases = showAll ? activePurchases : activePurchases.slice(0, 2);
  const hiddenCount = activePurchases.length - 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard variant="strong" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Active Mining Purchases</h3>
              <p className="text-xs text-muted-foreground">{activePurchases.length} active</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {displayedPurchases.map((purchase) => {
            const dailyUSD = purchase.dailyReturnBTC * btcPrice;
            const totalEarnedUSD = purchase.totalEarned * btcPrice;
            const displayedDailyBTC = purchase.dailyReturnBTC;

            return (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        {purchase.crypto}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {purchase.packageName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {purchase.hashrate} {purchase.hashrateUnit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-400">
                      +{getSymbol()}{convert(dailyUSD).toFixed(2)}/day
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      ₿{displayedDailyBTC.toFixed(8)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Cost</p>
                    <p className="text-xs font-medium text-foreground">
                      {getSymbol()}{convert(purchase.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Total Earned</p>
                    <p className="text-xs font-medium text-green-400">
                      +{getSymbol()}{convert(totalEarnedUSD).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">ROI</p>
                    <p className="text-xs font-medium text-amber-400">
                      {purchase.returnPercent}%
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {/* Show more/less button */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showAll ? "Show less" : `Show ${hiddenCount} more`}
            </button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function PackageCard({ pkg, index, onPurchase, isPending, userId }: { pkg: MiningPackage; index: number; onPurchase: (pkg: MiningPackage) => void; isPending?: boolean; userId?: string | null }) {
  const { convert, getSymbol } = useCurrency();
  const { btcPrice } = useBTCPrice();
  const isBTC = pkg.crypto === "BTC";
  
  // Calculate daily return in USD
  const dailyReturnUSD = pkg.dailyReturnBTC * btcPrice;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      data-testid={`card-package-${pkg.id}`}
    >
      <GlassCard 
        className="relative p-4" 
        glow={isBTC ? "btc" : "ltc"}
        animate={false}
      >
        {pkg.popular && (
          <Badge 
            className="absolute -top-2 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs whitespace-nowrap w-fit px-2"
            data-testid={`badge-popular-${pkg.id}`}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Best Value
          </Badge>
        )}
        
        {/* Compact header with image and key info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-2">
            <img 
              src={pkg.image} 
              alt={`${pkg.crypto} ${pkg.name}`}
              className="w-full h-full object-contain"
              data-testid={`img-package-${pkg.id}`}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                isBTC ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {pkg.crypto}
              </span>
              <h3 className="font-bold text-foreground">{pkg.name}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                {getSymbol()}{convert(pkg.cost).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs text-muted-foreground">one-time</span>
            </div>
          </div>
        </div>
        
        {/* Key metrics in a clean row */}
        <div className="grid grid-cols-3 gap-3 mb-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Hashrate</p>
            <p className="text-sm font-bold text-foreground">{pkg.hashrate}</p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="text-[10px] text-muted-foreground mb-0.5">Daily <span className="text-amber-400">₿</span></p>
            <p className="text-sm font-bold text-emerald-400">{getSymbol()}{convert(dailyReturnUSD).toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">ROI</p>
            <p className="text-sm font-bold text-amber-400">{pkg.returnPercent}%</p>
          </div>
        </div>
        
        {/* Duration badge with payback hint */}
        <div className="flex items-center justify-between mb-3">
          <Badge className="text-[10px] bg-green-500/15 text-green-400 border-green-500/20">
            5 YEAR CONTRACT
          </Badge>
          <span className="text-[10px] text-muted-foreground" title="At current BTC price. Faster if BTC rises!">
            ~{pkg.paybackMonths}mo payback*
          </span>
        </div>

        {/* Buy buttons - Card payment primary, crypto secondary */}
        <div className="space-y-2">
          {/* Main CTA - Card Payment */}
          {userId && (
            <StripePayButton
              userId={userId}
              amount={pkg.cost}
              productType="mining_package"
              productId={pkg.id}
              productName={`${pkg.crypto} ${pkg.name} Mining Package`}
              metadata={{ hashrate: pkg.hashrateValue, hashrateUnit: pkg.hashrateUnit, crypto: pkg.crypto }}
              size="sm"
              variant="default"
              className="w-full h-11 font-semibold text-white border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25"
              onPaymentSuccess={() => {
                window.location.reload();
              }}
            />
          )}
          
          {/* Secondary - Crypto/Wallet Payment full width like hashrate calculator */}
          <button
            onClick={() => onPurchase(pkg)}
            disabled={isPending}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            data-testid={`button-buy-${pkg.id}`}
            title="Pay with crypto balance"
          >
            <span className="text-amber-400 font-bold text-sm">₿</span>
            <span className="text-sm font-semibold text-foreground">Pay with Crypto Balance</span>
          </button>
        </div>
        
        {/* Payback note */}
        <p className="text-[9px] text-muted-foreground text-center mt-2 opacity-70">
          *Payback at current price. Could be faster if BTC rises.
        </p>
      </GlassCard>
    </motion.div>
  );
}

function HashRateCalculator({ onPurchase, onCryptoPurchase, isPending, userId }: { onPurchase: (data: { hashrate: number; cost: number; dailyReturnBTC: number; returnPercent: number }) => void; onCryptoPurchase: (data: { hashrate: number; cost: number; dailyReturnBTC: number; returnPercent: number }) => void; isPending?: boolean; userId?: string | null }) {
  const { convert, getSymbol } = useCurrency();
  const { btcPrice } = useBTCPrice();
  
  const [investAmount, setInvestAmount] = useState<number>(150);
  const [customInput, setCustomInput] = useState<string>("150");
  const [period, setPeriod] = useState<"daily" | "annual">("annual");
  
  // Base price is $30 per 1TH
  const basePrice = 30;
  
  // Derive hashrate from dollar amount
  const btcHashrate = Math.max(0.3, +(investAmount / basePrice).toFixed(1));
  
  // Calculate discount based on hashrate - more hashrate = lower price per TH
  const getPricePerTH = (hashrate: number) => {
    if (hashrate >= 100) return basePrice * 0.70;
    if (hashrate >= 50) return basePrice * 0.75;
    if (hashrate >= 30) return basePrice * 0.80;
    if (hashrate >= 20) return basePrice * 0.85;
    if (hashrate >= 10) return basePrice * 0.90;
    if (hashrate >= 5) return basePrice * 0.95;
    return basePrice;
  };
  
  const pricePerTH = getPricePerTH(btcHashrate);
  const estimatedCost = investAmount;
  
  // New calculation logic: up to 20% return on investment
  const annualUSDReturn = estimatedCost * 1.20;
  const dailyUSDReturn = annualUSDReturn / 365;
  
  // Convert USD returns to BTC
  const annualBTCReturn = annualUSDReturn / btcPrice;
  const dailyBTCReturn = dailyUSDReturn / btcPrice;
  
  // Calculate potential return if BTC reaches $150,000
  const futurePrice = 150000;
  const futureAnnualReturn = annualBTCReturn * futurePrice;
  
  const hashrateDisplay = `${btcHashrate} TH/s`;

  // Set amount and keep input in sync — always rounded to $5
  const setAmountSynced = (val: number) => {
    const clamped = Math.max(10, Math.min(15000, val));
    const rounded = Math.round(clamped / 5) * 5;
    setInvestAmount(rounded);
    setCustomInput(String(rounded));
  };

  // Handle custom input commit
  const commitCustomInput = () => {
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed >= 10 && parsed <= 15000) {
      setAmountSynced(parsed);
    } else {
      // Reset to current value
      setCustomInput(String(investAmount));
    }
  };
  
  return (
    <GlassCard className="p-5" variant="strong">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Custom Hashrate Calculator</h2>
          <p className="text-xs text-muted-foreground">Build your own mining package</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
          7 YEAR CONTRACT
        </Badge>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Investment Amount</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground font-numbers">$</span>
                <input
                  type="number"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onBlur={commitCustomInput}
                  onKeyDown={(e) => { if (e.key === "Enter") { commitCustomInput(); (e.target as HTMLInputElement).blur(); } }}
                  className="w-20 h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-foreground text-center focus:outline-none focus:border-[#0088FF]/50 font-numbers"
                  min={10}
                  max={15000}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-foreground">{hashrateDisplay}</span>
          </div>

          {/* iOS 26 Slider with integrated stepper */}
          <div className="flex items-center gap-2">
            {/* iOS-style stepper — decrement/increment pill */}
            <div className="flex h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
              <button
                onClick={() => setAmountSynced(investAmount - 5)}
                className="w-9 h-8 flex items-center justify-center text-foreground/80 bg-white/[0.06] hover:bg-white/10 active:bg-white/15 transition-colors text-base font-semibold"
                style={{ fontWeight: 590, letterSpacing: '-0.43px' }}
              >
                −
              </button>
              <div className="w-px h-6 self-center bg-white/20" />
              <button
                onClick={() => setAmountSynced(investAmount + 5)}
                className="w-9 h-8 flex items-center justify-center text-foreground/80 bg-white/[0.06] hover:bg-white/10 active:bg-white/15 transition-colors text-base font-semibold"
                style={{ fontWeight: 590, letterSpacing: '-0.43px' }}
              >
                +
              </button>
            </div>

            {/* Slider */}
            <div className="flex-1">
              <Slider
                value={[investAmount]}
                onValueChange={(v) => { const rounded = Math.round(v[0] / 5) * 5; setInvestAmount(rounded); setCustomInput(String(rounded)); }}
                min={10}
                max={15000}
                step={5}
                className="py-0"
                data-testid="slider-hashrate"
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2" style={{ paddingLeft: 78 }}>
            <span>$10</span>
            <span className="mr-0">$15,000</span>
          </div>
          
          {/* Quick buy section right after slider */}
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="flex justify-center mb-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/20">{hashrateDisplay}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-lg font-bold text-foreground">
                  {getSymbol()}{convert(estimatedCost).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Daily <span className="text-amber-400">₿</span></p>
                <p className="text-sm font-bold text-emerald-400">
                  +{getSymbol()}{convert(dailyUSDReturn).toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Quick Buy Buttons — stacked */}
            <div className="space-y-2">
              {userId && (
                <StripePayButton
                  userId={userId}
                  amount={estimatedCost}
                  productType="mining_package"
                  productName={`Custom BTC Mining ${btcHashrate} TH/s`}
                  metadata={{ hashrate: btcHashrate, hashrateUnit: "TH/s", crypto: "BTC" }}
                  variant="default"
                  className="w-full h-10 font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 shadow-lg shadow-emerald-500/25"
                  onPaymentSuccess={() => window.location.reload()}
                />
              )}
              <button
                onClick={() => {
                  onCryptoPurchase({
                    hashrate: btcHashrate,
                    cost: estimatedCost,
                    dailyReturnBTC: dailyBTCReturn,
                    returnPercent: 20,
                  });
                }}
                disabled={isPending}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="text-amber-400 font-bold text-sm">₿</span>
                <span className="text-sm font-semibold text-foreground">Pay with Crypto Balance</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-3 rounded-xl border border-white/[0.08] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Price per TH/s</span>
            <p className="text-sm font-bold text-foreground">
              {getSymbol()}{convert(pricePerTH).toFixed(2)}
              {pricePerTH < basePrice && (
                <span className="text-green-400 text-xs ml-1">
                  (-{Math.round((1 - pricePerTH/basePrice) * 100)}%)
                </span>
              )}
            </p>
          </div>
          
          <div className="border-t border-white/[0.08] pt-3">
            <span className="text-xs text-muted-foreground">Contract Cost</span>
            <p className="text-2xl font-bold text-foreground">
              {getSymbol()}{convert(estimatedCost).toFixed(2)}
            </p>
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Yield Calculator</Label>
          <Select 
            value={period} 
            onValueChange={(v) => setPeriod(v as "daily" | "annual")}
            defaultValue="annual"
          >
            <SelectTrigger data-testid="select-period" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Return</SelectItem>
              <SelectItem value="annual">Annual Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">
              {period === "daily" ? "Daily" : "Annual"} Return
            </span>
            <div className="text-right">
              <p className="text-sm font-bold text-green-400">
                {getSymbol()}{convert(period === "daily" ? dailyUSDReturn : annualUSDReturn).toFixed(2)}
                {period === "daily" ? "/day" : "/year"}
              </p>
              <p className="text-[9px] text-muted-foreground">
                ₿{(period === "daily" ? dailyBTCReturn : annualBTCReturn).toFixed(8)}
              </p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground">
              * Based on today's BTC price: ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="pt-2 border-t border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-amber-400">If BTC reaches $150,000:</span>
              <p className="text-xs font-bold text-amber-400">
                {getSymbol()}{convert(futureAnnualReturn).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year
              </p>
            </div>
          </div>
          
          {btcHashrate >= 10 && (
            <div className="pt-2 border-t border-border/30">
              <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                +10% Volume Bonus Applied
              </Badge>
            </div>
          )}
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground">
          All rewards paid in BTC • 7 year contract
        </p>
      </div>
    </GlassCard>
  );
}

function EmptyState({ onNavigateToInvest }: { onNavigateToInvest: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="text-center py-8">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4"
        >
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50" />
        </motion.div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-empty-title">
          No Active Contracts
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto" data-testid="text-empty-description">
          Purchase hashpower below to start mining crypto.
        </p>
      </GlassCard>
    </motion.div>
  );
}

// Supported payment currencies for mining purchases
const paymentCurrencies: CryptoType[] = ["USDT", "BTC", "LTC", "ETH"];

export function Mining({ chartData, contracts, poolStatus, onNavigateToInvest }: MiningProps) {
  const [activeTab, setActiveTab] = useState<"devices" | "hot">("hot");
  const [paymentCurrency, setPaymentCurrency] = useState<CryptoType>("USDT");
  const [cryptoConfirmOpen, setCryptoConfirmOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<MiningPackage | null>(null);
  const [pendingCustomPurchase, setPendingCustomPurchase] = useState<{ hashrate: number; cost: number; dailyReturnBTC: number; returnPercent: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const { btcPrice } = useBTCPrice();
  const { prices: cryptoPrices } = useCryptoPrices();
  
  // Ref for scrolling to active devices section
  const myDevicesRef = useRef<HTMLDivElement>(null);
  
  const scrollToMyDevices = () => {
    myDevicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { data: estimateConfig } = useQuery<{ miningEstimateMultiplier: number }>({
    queryKey: ["/api/config/estimates"],
    queryFn: async () => {
      const res = await fetch("/api/config/estimates");
      if (!res.ok) return { miningEstimateMultiplier: 1 };
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
  
  const hasContracts = contracts.length > 0;
  
  // Fetch user's wallet balances
  const { data: balanceData } = useQuery<{ balances: Array<{ symbol: string; balance: number }>, pending: Record<string, number> }>({
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

  // Fetch user's mining purchases
  const { data: miningPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/users", dbUserId, "mining-purchases"],
    queryFn: async () => {
      if (!dbUserId) return [];
      const response = await fetch(`/api/users/${dbUserId}/mining-purchases`);
      if (!response.ok) throw new Error("Failed to fetch mining purchases");
      return response.json();
    },
    enabled: !!dbUserId,
  });

  // Create mining purchase mutation
  const createPurchase = useMutation({
    mutationFn: async (purchaseData: any) => {
      const res = await fetch("/api/mining/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to purchase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balances", dbUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", dbUserId, "mining-purchases"] });
      toast({
        title: "Purchase Successful!",
        description: "Your mining package is now active.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get balance for selected payment currency (case-insensitive)
  const selectedWallet = wallets.find((w: any) => w.symbol.toUpperCase() === paymentCurrency.toUpperCase());
  const availableBalance = selectedWallet?.balance || 0;
  
  // Convert USD cost to selected crypto currency
  const convertUSDToCrypto = (usdAmount: number, currency: CryptoType): number => {
    const price = cryptoPrices[currency]?.price || 1;
    return usdAmount / price;
  };
  
  // Show crypto payment confirmation popup
  const showCryptoConfirmation = (pkg: MiningPackage) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase mining packages.",
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

    // Convert USD cost to selected payment currency
    const costInCrypto = convertUSDToCrypto(pkg.cost, paymentCurrency);
    
    if (availableBalance < costInCrypto) {
      const amountNeeded = costInCrypto - availableBalance;
      toast({
        title: "Deposit Required",
        description: `You need ${amountNeeded.toFixed(paymentCurrency === "USDT" ? 2 : 6)} more ${paymentCurrency}. Total: ${costInCrypto.toFixed(paymentCurrency === "USDT" ? 2 : 6)} ${paymentCurrency}`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation popup
    setPendingPurchase(pkg);
    setCryptoConfirmOpen(true);
  };
  
  // Execute the actual crypto purchase after confirmation
  const handlePackagePurchase = (pkg: MiningPackage) => {
    const costInCrypto = convertUSDToCrypto(pkg.cost, paymentCurrency);
    
    const purchasePayload = {
      userId: dbUserId,
      packageName: pkg.name,
      crypto: pkg.crypto,
      symbol: paymentCurrency,
      amount: costInCrypto,
      hashrate: pkg.hashrateValue,
      hashrateUnit: pkg.hashrateUnit,
      efficiency: pkg.efficiency,
      dailyReturnBTC: pkg.dailyReturnBTC,
      returnPercent: pkg.returnPercent,
      paybackMonths: pkg.paybackMonths,
    };
    
    createPurchase.mutate(purchasePayload);
    setCryptoConfirmOpen(false);
    setPendingPurchase(null);
  };

  // Handle custom hashpower purchase
  const handleCustomPurchase = (data: { hashrate: number; cost: number; dailyReturnBTC: number; returnPercent: number }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase mining packages.",
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
    
    // Convert USD cost to selected payment currency
    const costInCrypto = convertUSDToCrypto(data.cost, paymentCurrency);
    
    if (availableBalance < costInCrypto) {
      const amountNeeded = costInCrypto - availableBalance;
      toast({
        title: "Deposit Required",
        description: `You need to deposit ${amountNeeded.toFixed(paymentCurrency === "USDT" ? 2 : 6)} ${paymentCurrency} to buy this contract. Total cost: ${costInCrypto.toFixed(paymentCurrency === "USDT" ? 2 : 6)} ${paymentCurrency}`,
        variant: "destructive",
      });
      return;
    }

    // Calculate payback months safely
    const dailyUSDReturn = data.dailyReturnBTC * btcPrice;
    const paybackDays = dailyUSDReturn > 0 ? data.cost / dailyUSDReturn : 365;
    const paybackMonths = Math.ceil(paybackDays / 30);
    
    const purchasePayload = {
      userId: dbUserId,
      packageName: "Custom",
      crypto: "BTC",
      symbol: paymentCurrency,
      amount: costInCrypto,
      hashrate: data.hashrate,
      hashrateUnit: "TH/s",
      efficiency: "15W/TH",
      dailyReturnBTC: data.dailyReturnBTC,
      returnPercent: data.returnPercent,
      paybackMonths: paybackMonths,
    };
    
    createPurchase.mutate(purchasePayload);
  };

  // Show custom hashrate crypto payment confirmation popup
  const showCustomCryptoConfirmation = (data: { hashrate: number; cost: number; dailyReturnBTC: number; returnPercent: number }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase mining packages.",
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

    // Convert USD cost to selected payment currency
    const costInCrypto = convertUSDToCrypto(data.cost, paymentCurrency);
    
    if (availableBalance < costInCrypto) {
      const amountNeeded = costInCrypto - availableBalance;
      toast({
        title: "Deposit Required",
        description: `You need ${amountNeeded.toFixed(paymentCurrency === "USDT" ? 2 : 6)} more ${paymentCurrency}. Total: ${costInCrypto.toFixed(paymentCurrency === "USDT" ? 2 : 6)} ${paymentCurrency}`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation popup
    setPendingCustomPurchase(data);
    setCryptoConfirmOpen(true);
  };

  // Execute custom hashrate crypto purchase after confirmation
  const handleCustomPurchaseConfirm = (data: { hashrate: number; cost: number; dailyReturnBTC: number; returnPercent: number }) => {
    const costInCrypto = convertUSDToCrypto(data.cost, paymentCurrency);

    // Calculate payback months safely
    const dailyUSDReturn = data.dailyReturnBTC * btcPrice;
    const paybackDays = dailyUSDReturn > 0 ? data.cost / dailyUSDReturn : 365;
    const paybackMonths = Math.ceil(paybackDays / 30);
    
    const purchasePayload = {
      userId: dbUserId,
      packageName: "Custom",
      crypto: "BTC",
      symbol: paymentCurrency,
      amount: costInCrypto,
      hashrate: data.hashrate,
      hashrateUnit: "TH/s",
      efficiency: "15W/TH",
      dailyReturnBTC: data.dailyReturnBTC,
      returnPercent: data.returnPercent,
      paybackMonths: paybackMonths,
    };
    
    createPurchase.mutate(purchasePayload);
    setCryptoConfirmOpen(false);
    setPendingCustomPurchase(null);
  };
  
  // Filter out solo mining purchases - they should only appear on Solo Mining page
  const activePurchases = (miningPurchases || []).filter((p: any) => 
    p?.status === "active" && !String(p?.packageName || "").includes("Solo Mining")
  );

  const totalHashrateFromContracts = contracts.reduce((sum, c) => {
    if (c.hashrateUnit === "TH/s") return sum + c.hashrate;
    if (c.hashrateUnit === "MH/s") return sum + c.hashrate / 1000000;
    if (c.hashrateUnit === "PH/s") return sum + c.hashrate * 1000;
    return sum + c.hashrate / 1000;
  }, 0);

  const totalHashrateFromPurchases = activePurchases.reduce((sum: number, p: any) => {
    const unit = p?.hashrateUnit;
    const value = Number(p?.hashrate) || 0;
    if (unit === "TH/s") return sum + value;
    if (unit === "MH/s") return sum + value / 1000000;
    // Skip PH/s units here since those are solo mining
    return sum + value;
  }, 0);

  const totalHashrate = totalHashrateFromContracts + totalHashrateFromPurchases;
  const investedAmount = activePurchases.reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);
  const projectedAmount = activePurchases.reduce((sum: number, p: any) => {
    const amount = Number(p?.amount) || 0;
    const roi = Number(p?.returnPercent) || 0;
    return sum + amount * (1 + roi / 100);
  }, 0);

  const miningEarningsPerSecondUSDTBase = activePurchases.reduce((sum: number, p: any) => {
    // Calculate 0.5% daily of invested amount
    const investmentAmount = Number(p?.amount) || 0;
    const dailyUSDT = investmentAmount * 0.005; // 0.5% daily
    return sum + dailyUSDT / 86400;
  }, 0);

  const miningEstimateMultiplier = Number(estimateConfig?.miningEstimateMultiplier) || 1;
  const miningEarningsPerSecondUSDT = miningEarningsPerSecondUSDTBase * miningEstimateMultiplier;

  const secondsSinceMidnight = (() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((Date.now() - midnight.getTime()) / 1000));
  })();

  const miningEstimatedTodayUSDT = miningEarningsPerSecondUSDT * secondsSinceMidnight;

  const btcPackages = miningPackages.filter(p => p.crypto === "BTC");

  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <>
      <motion.div
        className="flex flex-col gap-4 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-testid="page-mining"
      >

        {/* ── Quick Stats Banner ── Only if active */}
        {(contracts.length + activePurchases.length > 0) && (
          <GlassCard delay={0.1} variant="strong" className="relative overflow-hidden py-3 px-4" glow="btc">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-transparent blur-2xl" />
            </div>
            <FloatingParticles />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground font-ui mb-0.5">Your Hashpower</p>
                  <AnimatedHashrateDisplay value={totalHashrate} unit="TH/s" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-ui mb-0.5">Today's Earnings</p>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-xs text-muted-foreground font-numbers">$</span>
                    <LiveGrowingBalance
                      value={miningEstimatedTodayUSDT}
                      perSecond={miningEarningsPerSecondUSDT}
                      active={miningEarningsPerSecondUSDT > 0}
                      decimals={6}
                      className="text-lg font-bold text-emerald-400 font-numbers"
                      showBadge={false}
                    />
                  </div>
                </div>
              </div>
              {/* Devices link */}
              <button
                onClick={scrollToMyDevices}
                className="w-full flex items-center justify-between mt-2.5 p-2 rounded-lg bg-white/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-medium text-foreground font-ui">{contracts.length + activePurchases.length} Active Devices</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </GlassCard>
        )}

        {/* ══════════ HORIZONTAL TAB PURCHASE FLOW ══════════ */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/[0.08]">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              step === 1
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 1 ? "bg-emerald-500/30 text-emerald-400" : "bg-white/10 text-muted-foreground"
            }`}>1</span>
            Type
          </button>
          <button
            onClick={() => { if (step >= 2) setStep(2); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              step === 2
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : step > 2
                  ? "text-emerald-400/60"
                  : "text-muted-foreground/50"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 2 ? "bg-emerald-500/30 text-emerald-400" : "bg-white/10 text-muted-foreground/50"
            }`}>2</span>
            Configure
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GlassCard delay={0} className="relative overflow-hidden">
                <h2 className="text-sm font-semibold text-foreground mb-4">Choose Mining Type</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActiveTab("hot"); setStep(2); }}
                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30 hover:border-emerald-500/50 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <i className="fi fi-tr-calculator text-emerald-400 text-lg" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Custom TH/s</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">Choose your exact hashrate</span>
                    <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase">POPULAR</span>
                    <span className="mt-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">Choose →</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("devices"); setStep(2); }}
                    className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all bg-gradient-to-b from-amber-500/8 to-transparent border-white/10 hover:border-amber-500/30 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <i className="fi fi-tr-chip text-amber-400 text-lg" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Packages</span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">Pre-built mining plans</span>
                    <span className="mt-1 text-[11px] font-semibold text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">Choose →</span>
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step >= 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "devices" ? (
                  <motion.div
                    key="devices"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {btcPackages.map((pkg, index) => (
                      <PackageCard key={pkg.id} pkg={pkg} index={index} onPurchase={showCryptoConfirmation} isPending={createPurchase.isPending} userId={dbUserId} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="hot"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <HashRateCalculator onPurchase={handleCustomPurchase} onCryptoPurchase={showCustomCryptoConfirmation} isPending={createPurchase.isPending} userId={dbUserId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust Badges — compact row */}
        <div className="flex items-center justify-around py-1">
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <badge.icon className="w-4 h-4 text-primary/60" />
              <p className="text-[8px] text-muted-foreground leading-tight font-ui text-center">{badge.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ===== MY DEVICES SECTION ===== */}
        {(activePurchases.length > 0 || hasContracts) && (
          <div ref={myDevicesRef} className="pt-6 scroll-mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">My Active Devices</h2>
                <p className="text-xs text-muted-foreground">{contracts.length + activePurchases.length} active contracts</p>
              </div>
            </div>
            
            {/* Active Mining Purchases */}
            {activePurchases.length > 0 && (
              <ActiveMiningPurchases purchases={miningPurchases} btcPrice={btcPrice} />
            )}

            {/* Active Contracts (if any) */}
            {hasContracts && (
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Legacy Contracts</h3>
                <div className="flex flex-col gap-3">
                  {contracts.map((contract, index) => (
                    <ContractCard key={contract.id} contract={contract} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk Disclosure - Compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-amber-400">Risk:</span> Mining returns are estimates. Cryptocurrency prices and network difficulty fluctuate. You may lose part or all of your investment.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Crypto Payment Confirmation Dialog */}
      <Dialog open={cryptoConfirmOpen} onOpenChange={setCryptoConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold">₿</span>
              </div>
              Confirm Crypto Payment
            </DialogTitle>
            <DialogDescription>
              You're about to purchase with your wallet balance
            </DialogDescription>
          </DialogHeader>
          
          {/* Package purchase confirmation */}
          {pendingPurchase && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{pendingPurchase.crypto} {pendingPurchase.name}</span>
                  <span className="text-xs text-muted-foreground">{pendingPurchase.hashrate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Payment Amount</span>
                  <span className="text-base font-bold text-amber-400">
                    {convertUSDToCrypto(pendingPurchase.cost, paymentCurrency).toFixed(paymentCurrency === "USDT" ? 2 : 6)} {paymentCurrency}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-muted-foreground">Your Balance</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {availableBalance.toFixed(paymentCurrency === "USDT" ? 2 : 6)} {paymentCurrency}
                </span>
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center">
                This will deduct from your {paymentCurrency} wallet balance
              </p>
            </div>
          )}

          {/* Custom hashrate purchase confirmation */}
          {pendingCustomPurchase && !pendingPurchase && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Custom BTC Mining</span>
                  <span className="text-xs text-muted-foreground">{pendingCustomPurchase.hashrate} TH/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Payment Amount</span>
                  <span className="text-base font-bold text-amber-400">
                    {convertUSDToCrypto(pendingCustomPurchase.cost, paymentCurrency).toFixed(paymentCurrency === "USDT" ? 2 : 6)} {paymentCurrency}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-muted-foreground">Your Balance</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {availableBalance.toFixed(paymentCurrency === "USDT" ? 2 : 6)} {paymentCurrency}
                </span>
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center">
                This will deduct from your {paymentCurrency} wallet balance
              </p>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCryptoConfirmOpen(false);
                setPendingPurchase(null);
                setPendingCustomPurchase(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingPurchase) {
                  handlePackagePurchase(pendingPurchase);
                } else if (pendingCustomPurchase) {
                  handleCustomPurchaseConfirm(pendingCustomPurchase);
                }
              }}
              disabled={createPurchase.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {createPurchase.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

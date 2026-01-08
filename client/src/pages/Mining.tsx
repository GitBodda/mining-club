import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { HashRateChart } from "@/components/HashRateChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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
  Flame
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { ChartDataPoint, MiningContract, PoolStatus } from "@/lib/types";

import btcMineImg from "@assets/Bitcoin_Mine_1766014388617.webp";
import ltcMineImg from "@assets/Gemini_Generated_Image_1ri2av1ri2av1ri2_(1)_1766014388604.webp";
import btcMiningCart from "@assets/Bitcoin_Mining_Cart_1766014388619.webp";
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
  image: string;
  popular?: boolean;
}

const miningPackages: MiningPackage[] = [
  {
    id: "btc-starter",
    name: "Starter",
    crypto: "BTC",
    cost: 99,
    hashrate: "10 TH/s",
    hashrateValue: 10,
    hashrateUnit: "TH/s",
    duration: 30,
    returnPercent: 22,
    image: btcMiningCart,
  },
  {
    id: "btc-pro",
    name: "Pro",
    crypto: "BTC",
    cost: 499,
    hashrate: "60 TH/s",
    hashrateValue: 60,
    hashrateUnit: "TH/s",
    duration: 60,
    returnPercent: 28,
    image: btcMineImg,
    popular: true,
  },
  {
    id: "btc-enterprise",
    name: "Enterprise",
    crypto: "BTC",
    cost: 1999,
    hashrate: "300 TH/s",
    hashrateValue: 300,
    hashrateUnit: "TH/s",
    duration: 90,
    returnPercent: 35,
    image: btcMiningCart,
  },
  {
    id: "ltc-starter",
    name: "Starter",
    crypto: "LTC",
    cost: 49,
    hashrate: "500 MH/s",
    hashrateValue: 500,
    hashrateUnit: "MH/s",
    duration: 30,
    returnPercent: 20,
    image: ltcMiningCart,
  },
  {
    id: "ltc-pro",
    name: "Pro",
    crypto: "LTC",
    cost: 249,
    hashrate: "3 GH/s",
    hashrateValue: 3,
    hashrateUnit: "GH/s",
    duration: 60,
    returnPercent: 26,
    image: ltcMiningCart,
    popular: true,
  },
  {
    id: "ltc-enterprise",
    name: "Enterprise",
    crypto: "LTC",
    cost: 999,
    hashrate: "15 GH/s",
    hashrateValue: 15,
    hashrateUnit: "GH/s",
    duration: 90,
    returnPercent: 32,
    image: ltcMiningCart,
  },
];

const trustBadges = [
  { icon: Clock, label: "24/7 Mining", description: "Non-stop operation" },
  { icon: Shield, label: "Guaranteed Returns", description: "Your profit secured" },
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

function PackageCard({ pkg, index }: { pkg: MiningPackage; index: number }) {
  const { convert, getSymbol } = useCurrency();
  const isBTC = pkg.crypto === "BTC";
  
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
            className="absolute -top-2 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs"
            data-testid={`badge-popular-${pkg.id}`}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        )}
        
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 flex-shrink-0">
            <img 
              src={pkg.image} 
              alt={`${pkg.crypto} ${pkg.name}`}
              className="w-full h-full object-contain"
              data-testid={`img-package-${pkg.id}`}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                isBTC 
                  ? "bg-amber-500/20 text-amber-400" 
                  : "bg-blue-500/20 text-blue-400"
              }`}>
                {pkg.crypto}
              </span>
              <h3 className="font-semibold text-foreground text-sm">{pkg.name}</h3>
            </div>
            
            <div className="text-xl font-bold text-foreground mb-2">
              {getSymbol()}{convert(pkg.cost).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <span className="text-muted-foreground">Hashrate</span>
                <p className="font-medium text-foreground">{pkg.hashrate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="font-medium text-foreground">{pkg.duration} days</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className={`text-base font-bold ${
                isBTC ? "text-amber-400" : "text-blue-400"
              }`}>
                +{pkg.returnPercent}% Return
              </div>
              <Button 
                size="sm"
                className={isBTC 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 h-8 text-xs" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 h-8 text-xs"
                }
                data-testid={`button-buy-${pkg.id}`}
              >
                Buy Now
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function HashRateCalculator() {
  const { convert, getSymbol } = useCurrency();
  const [crypto, setCrypto] = useState<"BTC" | "LTC">("BTC");
  const [duration, setDuration] = useState<number>(30);
  
  const isBTC = crypto === "BTC";
  
  const [btcHashrate, setBtcHashrate] = useState<number>(50);
  const [ltcHashrate, setLtcHashrate] = useState<number>(1000);
  
  const hashrate = isBTC ? btcHashrate : ltcHashrate;
  const setHashrate = isBTC ? setBtcHashrate : setLtcHashrate;
  
  const hashrateDisplay = useMemo(() => {
    if (isBTC) {
      return `${btcHashrate} TH/s`;
    } else {
      if (ltcHashrate >= 1000) {
        return `${(ltcHashrate / 1000).toFixed(1)} GH/s`;
      }
      return `${ltcHashrate} MH/s`;
    }
  }, [isBTC, btcHashrate, ltcHashrate]);
  
  const estimatedCost = useMemo(() => {
    if (isBTC) {
      const basePrice = 9.9;
      return btcHashrate * basePrice * (duration / 30);
    } else {
      const basePrice = 0.098;
      return ltcHashrate * basePrice * (duration / 30);
    }
  }, [isBTC, btcHashrate, ltcHashrate, duration]);
  
  const estimatedProfit = useMemo(() => {
    const returnRate = duration === 30 ? 0.22 : duration === 60 ? 0.28 : 0.35;
    return estimatedCost * returnRate;
  }, [estimatedCost, duration]);
  
  const totalReturn = estimatedCost + estimatedProfit;
  
  return (
    <GlassCard className="p-5" variant="strong">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Custom Hashrate Calculator</h2>
          <p className="text-xs text-muted-foreground">Build your own mining package</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Cryptocurrency</Label>
            <Select 
              value={crypto} 
              onValueChange={(v) => setCrypto(v as "BTC" | "LTC")}
            >
              <SelectTrigger data-testid="select-crypto" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Duration</Label>
            <Select 
              value={duration.toString()} 
              onValueChange={(v) => setDuration(parseInt(v))}
            >
              <SelectTrigger data-testid="select-duration" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground">Hashrate</Label>
            <span className={`text-base font-bold ${isBTC ? "text-amber-400" : "text-blue-400"}`}>
              {hashrateDisplay}
            </span>
          </div>
          <Slider
            value={[hashrate]}
            onValueChange={(v) => setHashrate(v[0])}
            min={isBTC ? 1 : 100}
            max={isBTC ? 500 : 50000}
            step={isBTC ? 1 : 100}
            className="py-2"
            data-testid="slider-hashrate"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{isBTC ? "1 TH/s" : "100 MH/s"}</span>
            <span>{isBTC ? "500 TH/s" : "50 GH/s"}</span>
          </div>
        </div>
        
        <div className="p-3 rounded-xl border border-white/[0.08]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <span className="text-xs text-muted-foreground">Estimated Cost</span>
              <p className="text-lg font-bold text-foreground">{getSymbol()}{convert(estimatedCost).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Expected Profit</span>
              <p className="text-lg font-bold text-green-400">+{getSymbol()}{convert(estimatedProfit).toFixed(2)}</p>
            </div>
          </div>
          <div className="border-t border-white/[0.08] pt-3">
            <span className="text-xs text-muted-foreground">Total Return</span>
            <p className={`text-xl font-bold ${isBTC ? "text-amber-400" : "text-blue-400"}`}>
              {getSymbol()}{convert(totalReturn).toFixed(2)}
            </p>
          </div>
        </div>
        
        <Button 
          className={`w-full ${isBTC 
            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
            : "bg-gradient-to-r from-blue-500 to-indigo-500"
          } text-white border-0`}
          size="default"
          data-testid="button-buy-custom"
        >
          Buy Custom Hashpower
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        <p className="text-center text-[10px] text-muted-foreground">
          Payments accepted in cryptocurrency only
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

export function Mining({ chartData, contracts, poolStatus, onNavigateToInvest }: MiningProps) {
  const [activeTab, setActiveTab] = useState<"devices" | "hot">("devices");
  const hasContracts = contracts.length > 0;
  
  const totalHashrate = contracts.reduce((sum, c) => {
    if (c.hashrateUnit === "TH/s") return sum + c.hashrate;
    if (c.hashrateUnit === "MH/s") return sum + c.hashrate / 1000000;
    return sum + c.hashrate / 1000;
  }, 0);

  const btcPackages = miningPackages.filter(p => p.crypto === "BTC");
  const ltcPackages = miningPackages.filter(p => p.crypto === "LTC");

  return (
    <>
      <motion.div
        className="flex flex-col gap-5 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-testid="page-mining"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Mining</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your hashpower & mining packages
          </p>
        </motion.div>

      {/* Active Hashpower Card (Smaller) */}
      <GlassCard delay={0.1} variant="strong" className="relative py-4 px-5">
        <FloatingParticles />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground mb-1">
              Your Active Hashpower
            </h2>
            <AnimatedHashrateDisplay value={totalHashrate} unit="TH/s" />
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs text-muted-foreground">
              {contracts.length} active
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex gap-2 px-1"
      >
        <button
          onClick={() => setActiveTab("devices")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all ${
            activeTab === "devices"
              ? "bg-primary/20 text-primary border-2 border-primary/30"
              : "bg-white/5 text-muted-foreground border-2 border-transparent hover:bg-white/10"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Devices</span>
        </button>
        <button
          onClick={() => setActiveTab("hot")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all ${
            activeTab === "hot"
              ? "bg-red-500/20 text-red-400 border-2 border-red-500/30"
              : "bg-white/5 text-muted-foreground border-2 border-transparent hover:bg-white/10"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="flex items-center gap-1.5">
            Hashrate
            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">HOT</span>
          </span>
        </button>
      </motion.div>

      {/* Active Contracts (if any) */}
      {hasContracts && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Contracts</h2>
          <div className="flex flex-col gap-3">
            {contracts.map((contract, index) => (
              <ContractCard key={contract.id} contract={contract} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-2">
        {trustBadges.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            data-testid={`badge-trust-${index}`}
          >
            <GlassCard className="p-2.5 text-center" variant="subtle" animate={false}>
              <badge.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-[10px] font-medium text-foreground">{badge.label}</p>
              <p className="text-[9px] text-muted-foreground">{badge.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Bitcoin Mining Packages */}
      <AnimatePresence mode="wait">
        {activeTab === "devices" ? (
          <motion.div
            key="devices"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">₿</span>
                </div>
                <h2 className="text-base font-semibold text-foreground">Bitcoin Mining Devices</h2>
              </div>
              <div className="space-y-3">
                {btcPackages.slice(0, 4).map((pkg, index) => (
                  <PackageCard key={pkg.id} pkg={pkg} index={index} />
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">Ł</span>
                </div>
                <h2 className="text-base font-semibold text-foreground">Litecoin Mining Devices</h2>
              </div>
              <div className="space-y-3">
                {ltcPackages.slice(0, 4).map((pkg, index) => (
                  <PackageCard key={pkg.id} pkg={pkg} index={index + 3} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="hot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <HashRateCalculator />
            {hasContracts && (
              <>
                <HashRateChart data={chartData} title="Earnings Over Time" />
                <PoolStatusCard status={poolStatus} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </>
  );
}

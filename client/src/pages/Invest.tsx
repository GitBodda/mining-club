import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap, 
  CheckCircle2,
  Calculator,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import btcMiningCart from "@assets/Bitcoin_Mining_Cart_1766014388619.png";
import btcMine from "@assets/Bitcoin_Mine_1766014388617.png";
import ltcMiningCart from "@assets/Gemini_Generated_Image_46ieyx46ieyx46ie_(1)_1766014388603.png";

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
    image: btcMine,
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
        className="relative p-5" 
        glow={isBTC ? "btc" : "ltc"}
        animate={false}
      >
        {pkg.popular && (
          <Badge 
            className="absolute -top-2 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            data-testid={`badge-popular-${pkg.id}`}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Popular
          </Badge>
        )}
        
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0">
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
              <h3 className="font-semibold text-foreground">{pkg.name}</h3>
            </div>
            
            <div className="text-2xl font-bold text-foreground mb-2">
              {getSymbol()}{convert(pkg.cost).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
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
              <div className={`text-lg font-bold ${
                isBTC ? "text-amber-400" : "text-blue-400"
              }`}>
                +{pkg.returnPercent}% Return
              </div>
              <Button 
                size="sm"
                className={isBTC 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                }
                data-testid={`button-buy-${pkg.id}`}
              >
                Buy Now
                <ArrowRight className="w-4 h-4 ml-1" />
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
  const [pricePrediction, setPricePrediction] = useState<string>("");
  
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
    <GlassCard className="p-6" variant="strong">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Custom Hashrate Calculator</h2>
          <p className="text-sm text-muted-foreground">Build your own mining package</p>
        </div>
      </div>
      
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Cryptocurrency</Label>
            <Select 
              value={crypto} 
              onValueChange={(v) => setCrypto(v as "BTC" | "LTC")}
            >
              <SelectTrigger data-testid="select-crypto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Duration</Label>
            <Select 
              value={duration.toString()} 
              onValueChange={(v) => setDuration(parseInt(v))}
            >
              <SelectTrigger data-testid="select-duration">
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
            <Label className="text-sm text-muted-foreground">Hashrate</Label>
            <span className={`text-lg font-bold ${isBTC ? "text-amber-400" : "text-blue-400"}`}>
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
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{isBTC ? "1 TH/s" : "100 MH/s"}</span>
            <span>{isBTC ? "500 TH/s" : "50 GH/s"}</span>
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Price Prediction (USD at contract end)
          </Label>
          <Input
            type="number"
            placeholder={isBTC ? "e.g., 100000" : "e.g., 150"}
            value={pricePrediction}
            onChange={(e) => setPricePrediction(e.target.value)}
            data-testid="input-price-prediction"
          />
        </div>
        
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
              <p className="text-xl font-bold text-foreground">{getSymbol()}{convert(estimatedCost).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Expected Profit</span>
              <p className="text-xl font-bold text-green-400">+{getSymbol()}{convert(estimatedProfit).toFixed(2)}</p>
            </div>
          </div>
          <div className="border-t border-white/[0.08] pt-4">
            <span className="text-sm text-muted-foreground">Total Return</span>
            <p className={`text-2xl font-bold ${isBTC ? "text-amber-400" : "text-blue-400"}`}>
              {getSymbol()}{convert(totalReturn).toFixed(2)}
            </p>
          </div>
        </div>
        
        <Button 
          className={`w-full ${isBTC 
            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
            : "bg-gradient-to-r from-blue-500 to-indigo-500"
          } text-white border-0`}
          size="lg"
          data-testid="button-buy-custom"
        >
          Buy Custom Hashpower
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <p className="text-center text-xs text-muted-foreground">
          Payments accepted in cryptocurrency only
        </p>
      </div>
    </GlassCard>
  );
}

export function Invest() {
  const btcPackages = miningPackages.filter(p => p.crypto === "BTC");
  const ltcPackages = miningPackages.filter(p => p.crypto === "LTC");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-6"
    >
      <motion.div 
        className="text-center py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Invest & Earn</h1>
        </div>
        
        <motion.div
          className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          data-testid="text-returns-headline"
        >
          Earn 20%+ Guaranteed Returns
        </motion.div>
        
        <p className="text-muted-foreground mb-4">
          Start mining Bitcoin & Litecoin with our proven infrastructure
        </p>
        
        <Badge 
          variant="outline" 
          className="bg-green-500/10 text-green-400 border-green-500/30 px-4 py-1"
          data-testid="badge-withdraw-guarantee"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Cancel & Withdraw Anytime
        </Badge>
      </motion.div>
      
      <div className="grid grid-cols-2 gap-3">
        {trustBadges.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            data-testid={`badge-trust-${index}`}
          >
            <GlassCard className="p-3 text-center" variant="subtle" animate={false}>
              <badge.icon className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-xs font-medium text-foreground">{badge.label}</p>
              <p className="text-[10px] text-muted-foreground">{badge.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-sm">₿</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Bitcoin Mining Packages</h2>
        </div>
        <div className="space-y-4">
          {btcPackages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} index={index} />
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-400 font-bold text-sm">Ł</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Litecoin Mining Packages</h2>
        </div>
        <div className="space-y-4">
          {ltcPackages.map((pkg, index) => (
            <PackageCard key={pkg.id} pkg={pkg} index={index + 3} />
          ))}
        </div>
      </div>
      
      <HashRateCalculator />
    </motion.div>
  );
}

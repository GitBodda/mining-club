import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Info, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { IOSStatusBar } from "@/components/IOSStatusBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import ethLogo from "@assets/ethereum-eth-3d-logo.png";
import zcashLogo from "@assets/zcash-zec-3d-logo.png";
import tonLogo from "@assets/ton-coin-3d-logo.png";
import bnbLogo from "@assets/bnb-binance-3d-logo.png";
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";
import usdcLogo from "@assets/usd-coin-3d-icon-png-download-4102016_1766038596188.webp";

type CryptoType = "BTC" | "LTC" | "ETH" | "USDT" | "USDC" | "TON";

const cryptoConfig: Record<CryptoType, { name: string; color: string; iconBg: string }> = {
  BTC: { name: "Bitcoin", color: "text-amber-400", iconBg: "bg-amber-500/20" },
  LTC: { name: "Litecoin", color: "text-blue-300", iconBg: "bg-blue-400/20" },
  ETH: { name: "Ethereum", color: "text-purple-400", iconBg: "bg-purple-500/20" },
  USDT: { name: "Tether", color: "text-emerald-400", iconBg: "bg-emerald-500/20" },
  USDC: { name: "USD Coin", color: "text-blue-400", iconBg: "bg-blue-500/20" },
  TON: { name: "Toncoin", color: "text-cyan-400", iconBg: "bg-cyan-500/20" },
};

const logoMap: Record<string, string> = {
  BTC: btcLogo,
  LTC: ltcLogo,
  ETH: ethLogo,
  ZCASH: zcashLogo,
  TON: tonLogo,
  BNB: bnbLogo,
  USDT: usdtLogo,
  USDC: usdcLogo,
};

interface ExchangeRate {
  from: CryptoType;
  to: CryptoType;
}

const popularPairs: ExchangeRate[] = [
  { from: "BTC", to: "USDT" },
  { from: "ETH", to: "USDT" },
  { from: "BTC", to: "ETH" },
  { from: "LTC", to: "USDT" },
];

export default function Exchange() {
  const { toast } = useToast();
  const { currency, getSymbol, convert } = useCurrency();
  const { prices: cryptoPricesData } = useCryptoPrices();

  const cryptoPrices: Record<CryptoType, number> = {
    BTC: cryptoPricesData.BTC?.price || 98500,
    LTC: cryptoPricesData.LTC?.price || 125,
    ETH: cryptoPricesData.ETH?.price || 3450,
    USDT: cryptoPricesData.USDT?.price || 1,
    USDC: cryptoPricesData.USDC?.price || 1,
    TON: cryptoPricesData.TON?.price || 5.2,
  };
  
  const [exchangeFrom, setExchangeFrom] = useState<CryptoType>("BTC");
  const [exchangeTo, setExchangeTo] = useState<CryptoType>("USDT");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: walletData, isLoading: isLoadingBalances } = useQuery<{ balances: any[], totalBalance: number }>({
    queryKey: ["/api/wallet/balances"],
  });

  const balances = walletData?.balances || [];
  const hasLoadedBalances = !isLoadingBalances && walletData !== undefined;

  const getCurrentBalance = (crypto: CryptoType) => {
    return balances.find((b: any) => b.symbol === crypto)?.balance || 0;
  };

  const hasNoBalance = hasLoadedBalances && balances.length > 0 && balances.every((b: any) => b.balance === 0);

  const calculateExchangeOutput = () => {
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) return "0.00";
    const inputValue = parseFloat(exchangeAmount) * cryptoPrices[exchangeFrom];
    const outputAmount = inputValue / cryptoPrices[exchangeTo];
    return outputAmount.toFixed(6);
  };

  const getExchangeRate = () => {
    return (cryptoPrices[exchangeFrom] / cryptoPrices[exchangeTo]).toFixed(6);
  };

  const handleSwapDirection = () => {
    const temp = exchangeFrom;
    setExchangeFrom(exchangeTo);
    setExchangeTo(temp);
    setExchangeAmount("");
  };

  const handleMaxAmount = () => {
    const balance = getCurrentBalance(exchangeFrom);
    setExchangeAmount(balance.toString());
  };

  const handleExchange = async () => {
    const fromBalance = getCurrentBalance(exchangeFrom);
    const amount = parseFloat(exchangeAmount);
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid exchange amount.",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > fromBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${exchangeFrom} to complete this exchange.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Exchange Submitted",
      description: `Converting ${amount} ${exchangeFrom} to ${calculateExchangeOutput()} ${exchangeTo}. Your balance will be updated shortly.`,
    });
    
    setExchangeAmount("");
    setIsSubmitting(false);
  };

  const CryptoIcon = ({ crypto, className }: { crypto: CryptoType; className?: string }) => {
    if (logoMap[crypto]) {
      return <img src={logoMap[crypto]} alt={crypto} className={cn("w-6 h-6 object-contain", className)} />;
    }
    return (
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", cryptoConfig[crypto].iconBg, cryptoConfig[crypto].color, className)}>
        {crypto.charAt(0)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 pointer-events-none" />
      
      <IOSStatusBar />
      
      <motion.div
        className="flex flex-col gap-6 pb-8 px-4 pt-4 flex-1 overflow-y-auto relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl liquid-glass flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
            <div>
            <h1 className="text-2xl font-bold text-foreground">Exchange</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Swap cryptocurrencies instantly</p>
          </div>
        </div>
      </motion.header>

      {hasNoBalance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">No Funds Available</p>
            <p className="text-sm text-red-300/80 mt-1">
              You don't have any cryptocurrency to exchange. Please deposit funds first to use the exchange feature.
            </p>
            <Link href="/wallet">
              <Button variant="outline" size="sm" className="mt-3" data-testid="button-go-deposit">
                Go to Wallet
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      <GlassCard delay={0.1}>
        <div className="space-y-5">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/80">
              We handle all blockchain bridging and network conversions automatically. Your exchange will be processed at the current market rate with minimal fees.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground">From</Label>
            <div className="flex gap-3">
              <Select
                value={exchangeFrom}
                onValueChange={(value) => setExchangeFrom(value as CryptoType)}
              >
                <SelectTrigger className="w-36 liquid-glass border-white/10" data-testid="select-exchange-from">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                  {(["BTC", "LTC", "ETH", "USDT", "USDC", "TON"] as CryptoType[]).map((crypto) => (
                    <SelectItem key={crypto} value={crypto} data-testid={`option-from-${crypto.toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        <CryptoIcon crypto={crypto} className="w-5 h-5" />
                        <span>{crypto}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={exchangeAmount}
                  onChange={(e) => setExchangeAmount(e.target.value)}
                  className="liquid-glass border-white/10 pr-16"
                  data-testid="input-exchange-amount"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-primary"
                  onClick={handleMaxAmount}
                  data-testid="button-max-amount"
                >
                  MAX
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {getCurrentBalance(exchangeFrom).toFixed(6)} {exchangeFrom}
            </p>
          </div>

          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 liquid-glass border-white/10"
              onClick={handleSwapDirection}
              data-testid="button-swap-direction"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground">To</Label>
            <div className="flex gap-3">
              <Select
                value={exchangeTo}
                onValueChange={(value) => setExchangeTo(value as CryptoType)}
              >
                <SelectTrigger className="w-36 liquid-glass border-white/10" data-testid="select-exchange-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="liquid-glass border-white/10 bg-background/95 backdrop-blur-xl">
                  {(["BTC", "LTC", "ETH", "USDT", "USDC", "TON"] as CryptoType[]).filter(c => c !== exchangeFrom).map((crypto) => (
                    <SelectItem key={crypto} value={crypto} data-testid={`option-to-${crypto.toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        <CryptoIcon crypto={crypto} className="w-5 h-5" />
                        <span>{crypto}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                value={calculateExchangeOutput()}
                readOnly
                className="flex-1 liquid-glass border-white/10 bg-white/5"
                data-testid="text-exchange-output"
              />
            </div>
          </div>

          <div className="liquid-glass rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">1 {exchangeFrom} = {getExchangeRate()} {exchangeTo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee</span>
              <span className="text-emerald-400">0.5%</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-3">
              <span className="text-muted-foreground">You will receive</span>
              <span className="font-semibold text-lg" data-testid="text-final-output">
                {exchangeAmount && parseFloat(exchangeAmount) > 0 
                  ? (parseFloat(calculateExchangeOutput()) * 0.995).toFixed(6)
                  : "0.00"} {exchangeTo}
              </span>
            </div>
          </div>

          <Button
            className="w-full liquid-glass bg-primary/80 border-0"
            disabled={
              !exchangeAmount || 
              parseFloat(exchangeAmount) <= 0 || 
              parseFloat(exchangeAmount) > getCurrentBalance(exchangeFrom) ||
              isSubmitting
            }
            onClick={handleExchange}
            data-testid="button-confirm-exchange"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                Exchange Now
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Popular Pairs</h2>
        <div className="grid gap-3">
          {popularPairs.map((pair, index) => (
            <motion.div
              key={`${pair.from}-${pair.to}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <GlassCard 
                className="p-4 cursor-pointer hover-elevate"
                onClick={() => {
                  setExchangeFrom(pair.from);
                  setExchangeTo(pair.to);
                  setExchangeAmount("");
                }}
                data-testid={`pair-${pair.from.toLowerCase()}-${pair.to.toLowerCase()}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <CryptoIcon crypto={pair.from} className="w-8 h-8 rounded-full border-2 border-background" />
                      <CryptoIcon crypto={pair.to} className="w-8 h-8 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <p className="font-medium">{pair.from}/{pair.to}</p>
                      <p className="text-xs text-muted-foreground">{cryptoConfig[pair.from].name} to {cryptoConfig[pair.to].name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const change24h = cryptoPricesData[pair.from]?.change24h ?? 0;
                      const isStableQuote = pair.to === "USDT" || pair.to === "USDC";
                      const rate = isStableQuote
                        ? cryptoPrices[pair.from]
                        : (cryptoPrices[pair.from] / cryptoPrices[pair.to]);

                      return (
                        <>
                          <p className="font-medium">
                            {isStableQuote
                              ? `${getSymbol()}${convert(rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                              : `1 ${pair.from} = ${rate.toFixed(6)} ${pair.to}`}
                          </p>
                          <p className={cn(
                            "text-xs flex items-center gap-1 justify-end",
                            change24h >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            By using our exchange, you agree to our{" "}
            <Link href="/privacy" data-testid="link-terms">
              <span className="text-primary hover:underline">Terms of Service</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

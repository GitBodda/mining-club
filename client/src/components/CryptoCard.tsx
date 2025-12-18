import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { WalletBalance } from "@/lib/types";

import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";
import ltcLogo from "@assets/litecoin-3d-icon-png-download-4466121_1766014388608.png";
import usdtLogo from "@assets/tether-usdt-coin-3d-icon-png-download-3478983@0_1766038564971.webp";
import usdcLogo from "@assets/usd-coin-3d-icon-png-download-4102016_1766038596188.webp";

interface CryptoCardProps {
  crypto: WalletBalance;
  index: number;
  onDeposit?: (symbol: string) => void;
  onWithdraw?: (symbol: string) => void;
}

const logoMap: Record<string, string> = {
  BTC: btcLogo,
  LTC: ltcLogo,
  USDT: usdtLogo,
  USDC: usdcLogo,
};

const colorMap: Record<string, { gradient: string; border: string }> = {
  BTC: {
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
  },
  LTC: {
    gradient: "from-blue-400/20 to-slate-400/10",
    border: "border-blue-400/20",
  },
  USDT: {
    gradient: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20",
  },
  USDC: {
    gradient: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/20",
  },
};

export function CryptoCard({ crypto, index, onDeposit, onWithdraw }: CryptoCardProps) {
  const colors = colorMap[crypto.symbol] || colorMap.BTC;
  const logo = logoMap[crypto.symbol] || btcLogo;
  const isPositive = crypto.change24h >= 0;

  return (
    <motion.div
      data-testid={`crypto-card-${crypto.symbol.toLowerCase()}`}
      className={cn(
        "relative rounded-2xl p-4",
        "liquid-glass",
        "border",
        colors.border
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50 pointer-events-none" 
           style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
      
      <div className="flex items-center gap-4 relative z-10">
        <img 
          src={logo} 
          alt={crypto.symbol}
          className="w-12 h-12 object-contain"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{crypto.symbol}</h4>
            <span className="text-sm text-muted-foreground truncate">{crypto.name}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-balance-${crypto.symbol.toLowerCase()}`}>
            {crypto.balance.toFixed(6)} {crypto.symbol}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-foreground" data-testid={`text-usd-value-${crypto.symbol.toLowerCase()}`}>
            ${crypto.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div
            className={cn(
              "flex items-center justify-end gap-1 text-sm mt-0.5",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span data-testid={`text-change-${crypto.symbol.toLowerCase()}`}>
              {isPositive ? "+" : ""}{crypto.change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {(onDeposit || onWithdraw) && (
        <div className="flex gap-2 mt-3 relative z-10">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 liquid-glass border-0 bg-white/[0.06] text-xs gap-1"
            onClick={() => onDeposit?.(crypto.symbol)}
            data-testid={`button-deposit-${crypto.symbol.toLowerCase()}`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Deposit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 liquid-glass border-0 bg-white/[0.06] text-xs gap-1"
            onClick={() => onWithdraw?.(crypto.symbol)}
            data-testid={`button-withdraw-${crypto.symbol.toLowerCase()}`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Withdraw
          </Button>
        </div>
      )}
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SiBitcoin, SiEthereum, SiLitecoin, SiDogecoin } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { WalletBalance } from "@/lib/types";

interface CryptoCardProps {
  crypto: WalletBalance;
  index: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BTC: SiBitcoin,
  ETH: SiEthereum,
  LTC: SiLitecoin,
  DOGE: SiDogecoin,
};

const colorMap: Record<string, string> = {
  BTC: "from-orange-500/20 to-amber-500/10 text-orange-400",
  ETH: "from-blue-500/20 to-indigo-500/10 text-blue-400",
  LTC: "from-gray-400/20 to-slate-400/10 text-gray-300",
  DOGE: "from-yellow-500/20 to-amber-400/10 text-yellow-400",
};

export function CryptoCard({ crypto, index }: CryptoCardProps) {
  const Icon = iconMap[crypto.symbol] || SiBitcoin;
  const colorClass = colorMap[crypto.symbol] || colorMap.BTC;
  const isPositive = crypto.change24h >= 0;

  return (
    <motion.div
      data-testid={`crypto-card-${crypto.symbol.toLowerCase()}`}
      className={cn(
        "relative rounded-2xl p-4",
        "bg-gradient-to-br from-white/[0.06] to-white/[0.02]",
        "backdrop-blur-lg",
        "border border-white/[0.06]",
        "hover-elevate active-elevate-2"
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl",
            "flex items-center justify-center",
            "bg-gradient-to-br",
            colorClass
          )}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{crypto.symbol}</h4>
            <span className="text-sm text-muted-foreground truncate">{crypto.name}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {crypto.balance.toFixed(6)} {crypto.symbol}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-foreground">
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
            <span>{isPositive ? "+" : ""}{crypto.change24h.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

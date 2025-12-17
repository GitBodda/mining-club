import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Pickaxe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
}

export function TransactionItem({ transaction, index }: TransactionItemProps) {
  const icons = {
    earned: Pickaxe,
    withdrawn: ArrowUpRight,
    received: ArrowDownLeft,
  };

  const colors = {
    earned: "from-emerald-500/20 to-green-500/10 text-emerald-400",
    withdrawn: "from-orange-500/20 to-amber-500/10 text-orange-400",
    received: "from-blue-500/20 to-indigo-500/10 text-blue-400",
  };

  const labels = {
    earned: "Mining Reward",
    withdrawn: "Withdrawal",
    received: "Received",
  };

  const Icon = icons[transaction.type];

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      data-testid={`transaction-${transaction.id}`}
      className={cn(
        "flex items-center gap-4 py-3",
        "border-b border-white/[0.04] last:border-0"
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl",
          "flex items-center justify-center",
          "bg-gradient-to-br",
          colors[transaction.type]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground">{labels[transaction.type]}</h4>
        <p className="text-sm text-muted-foreground">{formatDate(transaction.timestamp)}</p>
      </div>

      <div className="text-right">
        <p className={cn(
          "font-medium",
          transaction.type === "withdrawn" ? "text-orange-400" : "text-emerald-400"
        )}>
          {transaction.type === "withdrawn" ? "-" : "+"}
          {transaction.amount.toFixed(6)} {transaction.symbol}
        </p>
        <p className="text-sm text-muted-foreground">
          ${transaction.usdValue.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
}

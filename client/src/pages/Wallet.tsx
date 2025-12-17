import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { CryptoCard } from "@/components/CryptoCard";
import { TransactionItem } from "@/components/TransactionItem";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import type { WalletBalance, Transaction } from "@/lib/types";

interface WalletProps {
  balances: WalletBalance[];
  transactions: Transaction[];
  totalBalance: number;
  change24h: number;
}

export function Wallet({ balances, transactions, totalBalance, change24h }: WalletProps) {
  const isPositive = change24h >= 0;

  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your mining earnings</p>
      </motion.header>

      <GlassCard delay={0.1} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5" />
        
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
          <div className="flex items-baseline gap-2 mb-2">
            <AnimatedCounter
              value={totalBalance}
              decimals={2}
              prefix="$"
              className="text-4xl font-bold text-foreground"
            />
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            <span>{isPositive ? "+" : ""}{change24h.toFixed(2)}%</span>
            <span className="text-muted-foreground">today</span>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              data-testid="button-wallet-send"
              variant="secondary"
              className="flex-1 h-12 rounded-xl bg-white/[0.08] border-white/[0.08]"
            >
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Send
            </Button>
            <Button
              data-testid="button-wallet-receive"
              variant="secondary"
              className="flex-1 h-12 rounded-xl bg-white/[0.08] border-white/[0.08]"
            >
              <ArrowDownLeft className="w-5 h-5 mr-2" />
              Receive
            </Button>
            <Button
              data-testid="button-wallet-swap"
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-xl bg-white/[0.08] border-white/[0.08]"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Assets</h2>
        <div className="flex flex-col gap-3">
          {balances.map((crypto, index) => (
            <CryptoCard key={crypto.id} crypto={crypto} index={index} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <GlassCard delay={0.3} className="p-4">
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <TransactionItem key={tx.id} transaction={tx} index={index} />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start mining to earn rewards
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, RefreshCw, 
  Filter, Clock, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";

type TransactionStatus = "completed" | "pending" | "failed";
type TransactionType = "withdrawal" | "deposit" | "payout";

interface HistoryTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  crypto: string;
  usdValue: number;
  status: TransactionStatus;
  date: string;
  txHash?: string;
  network?: string;
  address?: string;
}

const mockTransactions: HistoryTransaction[] = [
  {
    id: "1",
    type: "payout",
    amount: 0.00234,
    crypto: "BTC",
    usdValue: 223.45,
    status: "completed",
    date: "2024-12-28T10:30:00",
    txHash: "0x1a2b3c4d...",
    network: "Bitcoin",
  },
  {
    id: "2",
    type: "withdrawal",
    amount: 150,
    crypto: "USDT",
    usdValue: 150,
    status: "pending",
    date: "2024-12-27T14:22:00",
    network: "ERC20",
    address: "0x742d...3e4f",
  },
  {
    id: "3",
    type: "deposit",
    amount: 500,
    crypto: "USDT",
    usdValue: 500,
    status: "completed",
    date: "2024-12-26T09:15:00",
    txHash: "0x5e6f7g8h...",
    network: "BSC",
  },
  {
    id: "4",
    type: "withdrawal",
    amount: 0.05,
    crypto: "ETH",
    usdValue: 175.50,
    status: "failed",
    date: "2024-12-25T16:45:00",
    network: "ERC20",
    address: "0x892a...7b2c",
  },
  {
    id: "5",
    type: "payout",
    amount: 0.00156,
    crypto: "BTC",
    usdValue: 148.92,
    status: "completed",
    date: "2024-12-24T08:00:00",
    txHash: "0x9i0j1k2l...",
    network: "Bitcoin",
  },
];

interface HistoryProps {
  onNavigateToHome?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToInvest?: () => void;
  onOpenSettings?: () => void;
}

export function History({ onNavigateToHome, onNavigateToWallet, onNavigateToInvest, onOpenSettings }: HistoryProps = {}) {
  const { convert, getSymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<"all" | "withdrawals" | "payouts">("all");

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants = {
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="w-5 h-5 text-emerald-400" />;
      case "withdrawal":
        return <ArrowUpFromLine className="w-5 h-5 text-red-400" />;
      case "payout":
        return <RefreshCw className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "withdrawals") return tx.type === "withdrawal";
    if (activeTab === "payouts") return tx.type === "payout";
    return true;
  });

  return (
    <>
      <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 max-w-md mx-auto px-4 pt-16 pb-8 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.header
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/wallet">
            <Button variant="ghost" size="icon" className="rounded-xl" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl liquid-glass flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Withdrawals & Payouts</p>
            </div>
          </div>
        </motion.header>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full liquid-glass bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="flex-1" data-testid="tab-all">
              All
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex-1" data-testid="tab-withdrawals">
              Withdrawals
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1" data-testid="tab-payouts">
              Payouts
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredTransactions.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions found</p>
              </GlassCard>
            ) : (
              filteredTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard 
                    className="p-4 hover-elevate cursor-pointer" 
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground capitalize">{tx.type}</p>
                          {getStatusBadge(tx.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {tx.amount} {tx.crypto} • {tx.network}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(tx.date)}
                        </p>
                        {tx.txHash && (
                          <p className="text-xs text-primary mt-1 truncate">
                            TX: {tx.txHash}
                          </p>
                        )}
                        {tx.address && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            To: {tx.address}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold ${
                          tx.type === "deposit" || tx.type === "payout" 
                            ? "text-emerald-400" 
                            : "text-foreground"
                        }`}>
                          {tx.type === "withdrawal" ? "-" : "+"}{getSymbol()}{convert(tx.usdValue).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Showing last 30 days of transactions
          </p>
        </div>
      </motion.div>
      </div>
    </>
  );
}

export default History;

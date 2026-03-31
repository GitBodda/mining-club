import { motion } from "framer-motion";
import { Zap, Clock, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StarterReward {
  id: string;
  status: string;
  hashrate: number;
  hashrateUnit: string;
  crypto: string;
  durationDays: number;
  dailyReturnBtc: number;
  totalEarned: number;
  grantedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  progress?: number;
}

interface StarterMinerCardProps {
  starterReward?: StarterReward | null;
  onViewDetails?: () => void;
}

function daysRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function StarterMinerCard({ starterReward, onViewDetails }: StarterMinerCardProps) {
  if (!starterReward) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-4 bg-gradient-to-br from-orange-900/30 via-amber-900/10 to-transparent border border-orange-500/20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-400/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-orange-400/60" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Free Starter Miner</p>
            <p className="text-xs text-muted-foreground/60">No starter miner yet — sign up to get yours!</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const days    = daysRemaining(starterReward.expiresAt);
  const pct     = starterReward.progress ?? 0;
  const isActive = starterReward.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl overflow-hidden border ${
        isActive ? "border-orange-500/30" : "border-white/10"
      }`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-amber-500/10 to-transparent" />
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-amber-400/10 rounded-full blur-xl" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Free Starter Miner</p>
              <p className="text-xs text-muted-foreground">Auto-activated on signup</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isActive
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-white/10 text-muted-foreground"
          }`}>
            {isActive ? "ACTIVE" : starterReward.status.toUpperCase()}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBox
            label="Hashrate"
            value={`${starterReward.hashrate} ${starterReward.hashrateUnit}`}
            icon={<Zap className="w-3 h-3" />}
          />
          <StatBox
            label="Days Left"
            value={isActive ? `${days}d` : "—"}
            icon={<Clock className="w-3 h-3" />}
          />
          <StatBox
            label="Daily Est."
            value={`${(starterReward.dailyReturnBtc * 1e6).toFixed(2)} sats`}
            icon={<TrendingUp className="w-3 h-3" />}
          />
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Mining progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* CTA */}
        {onViewDetails && (
          <Button
            size="sm"
            variant="outline"
            className="w-full border-orange-500/30 hover:border-orange-500/50 text-sm"
            onClick={onViewDetails}
          >
            View Details <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}

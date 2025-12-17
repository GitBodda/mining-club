import { motion } from "framer-motion";
import { Users, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { MiningPool } from "@/lib/types";

interface PoolCardProps {
  pool: MiningPool;
  index: number;
  onSelect: (id: string) => void;
}

export function PoolCard({ pool, index, onSelect }: PoolCardProps) {
  return (
    <motion.button
      data-testid={`pool-card-${pool.id}`}
      onClick={() => onSelect(pool.id)}
      className={cn(
        "relative w-full rounded-2xl p-4 text-left",
        "bg-gradient-to-br from-white/[0.06] to-white/[0.02]",
        "backdrop-blur-lg",
        "border transition-colors duration-200",
        pool.isActive
          ? "border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          : "border-white/[0.06]",
        "hover-elevate active-elevate-2"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      {pool.isActive && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl",
            "flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-purple-500/10"
          )}
        >
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{pool.name}</h4>
          <p className="text-sm text-muted-foreground">{pool.hashRate}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {pool.miners.toLocaleString()}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {pool.fee}% fee
          </span>
        </div>
        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0">
          {pool.apy}% APY
        </Badge>
      </div>
    </motion.button>
  );
}

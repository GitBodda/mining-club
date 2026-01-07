import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit?: string;
  suffix?: string;
  decimals?: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "primary" | "green" | "orange" | "blue";
  delay?: number;
}

const colorClasses = {
  primary: "from-primary/20 to-purple-500/10 text-primary",
  green: "from-emerald-500/20 to-green-500/10 text-emerald-400",
  orange: "from-orange-500/20 to-amber-500/10 text-orange-400",
  blue: "from-cyan-500/20 to-blue-500/10 text-cyan-400",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  unit = "",
  suffix = "",
  decimals = 0,
  trend,
  trendValue,
  color = "primary",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-xl p-3 sm:p-4",
        "bg-gradient-to-br from-white/[0.06] to-white/[0.02]",
        "backdrop-blur-lg",
        "border border-white/[0.06]"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div
          className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl",
            "flex items-center justify-center",
            "bg-gradient-to-br",
            colorClasses[color]
          )}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" && "bg-emerald-500/20 text-emerald-400",
              trend === "down" && "bg-red-500/20 text-red-400",
              trend === "neutral" && "bg-gray-500/20 text-gray-400"
            )}
          >
            {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendValue}
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-sm mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <AnimatedCounter
          value={value}
          decimals={decimals}
          className="text-2xl font-bold text-foreground"
          suffix={suffix}
        />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </motion.div>
  );
}

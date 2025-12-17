import { motion } from "framer-motion";
import { Bell, Zap, Clock, Thermometer, Cpu } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { MiningButton } from "@/components/MiningButton";
import { StatCard } from "@/components/StatCard";
import { HashRateChart } from "@/components/HashRateChart";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import type { MiningStats, ChartDataPoint } from "@/lib/types";

interface DashboardProps {
  miningStats: MiningStats;
  chartData: ChartDataPoint[];
  onToggleMining: () => void;
  isPending?: boolean;
}

export function Dashboard({ miningStats, chartData, onToggleMining, isPending }: DashboardProps) {
  return (
    <motion.div
      className="flex flex-col gap-6 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.header
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">CryptoMine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {miningStats.isActive ? "Mining in progress" : "Ready to mine"}
          </p>
        </div>
        <button
          data-testid="button-notifications"
          className="relative w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center hover-elevate"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </button>
      </motion.header>

      <GlassCard glow={miningStats.isActive} delay={0.1} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${miningStats.isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-sm text-muted-foreground">
              {miningStats.isActive ? "Connected to " + miningStats.poolName : "Disconnected"}
            </span>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-2">Current Hash Rate</p>
            <div className="flex items-baseline justify-center gap-2">
              <AnimatedCounter
                value={miningStats.hashRate}
                decimals={2}
                className="text-5xl font-bold text-foreground tracking-tight"
              />
              <span className="text-xl text-muted-foreground">{miningStats.hashRateUnit}</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <MiningButton
              isActive={miningStats.isActive}
              isPending={isPending}
              onToggle={onToggleMining}
            />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Clock}
          label="Mining Time"
          value={miningStats.miningTime}
          suffix="h"
          decimals={1}
          color="primary"
          delay={0.2}
        />
        <StatCard
          icon={Zap}
          label="Power Usage"
          value={miningStats.powerUsage}
          unit="W"
          color="orange"
          trend="down"
          trendValue="5%"
          delay={0.25}
        />
        <StatCard
          icon={Thermometer}
          label="Temperature"
          value={miningStats.temperature}
          suffix="°"
          color="blue"
          delay={0.3}
        />
        <StatCard
          icon={Cpu}
          label="Efficiency"
          value={miningStats.efficiency}
          suffix="%"
          decimals={1}
          color="green"
          trend="up"
          trendValue="2%"
          delay={0.35}
        />
      </div>

      <HashRateChart data={chartData} title="Performance (24h)" />

      <GlassCard delay={0.4} className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Today's Earnings</p>
            <div className="flex items-baseline gap-2 mt-1">
              <AnimatedCounter
                value={0.00042}
                decimals={5}
                className="text-2xl font-bold text-foreground"
              />
              <span className="text-sm text-muted-foreground">BTC</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-400">+12.5%</p>
            <p className="text-sm text-muted-foreground mt-1">$18.42 USD</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

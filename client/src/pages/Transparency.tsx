import { motion } from "framer-motion";
import { BarChart2, ArrowLeft, Shield, Cpu, Users, DollarSign, TrendingUp, Lock, Eye, Server } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";

interface TransparencyProps {
  onBack?: () => void;
}

function StatBlock({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function Transparency({ onBack }: TransparencyProps) {
  const [, navigate] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/growth/platform-stats"],
    queryFn: async () => {
      const res = await fetch("/api/growth/platform-stats");
      return res.ok ? res.json() : null;
    },
    staleTime: 120_000,
  });

  const fmt = (n: number | undefined | null, fallback = "–") =>
    n !== null && n !== undefined ? n.toLocaleString() : fallback;

  return (
    <div className="min-h-screen pb-24">
      <ScrollAwareStatusBar />
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack ?? (() => navigate("/growth"))} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Platform Transparency</h1>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-blue-500/30 p-6 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent" />
          <div className="relative z-10">
            <Eye className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Full Transparency
            </h2>
            <p className="text-sm text-muted-foreground">
              Real numbers, no hype. Here's the current state of the BlockMint platform.
            </p>
          </div>
        </motion.div>

        {/* Live platform stats */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            Live Platform Stats
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Updated in real-time from our database.</p>
          <div>
            <StatBlock label="Total Registered Users"     icon={Users}      value={fmt(stats?.totalUsers)} />
            <StatBlock label="Active Miners"              icon={Cpu}        value={fmt(stats?.activeMiners)} />
            <StatBlock label="Founding Members Claimed"   icon={Shield}     value={`${fmt(stats?.foundersClaimed)} / ${fmt(stats?.foundersCapTotal)}`} />
            <StatBlock label="Total Referral Commissions Paid" icon={DollarSign} value={stats?.totalReferralsPaid != null ? `$${Number(stats.totalReferralsPaid).toFixed(2)}` : "–"} />
            <StatBlock label="Total Mining Reward Events" icon={TrendingUp}  value={fmt(stats?.totalRewardEvents)} />
          </div>
        </GlassCard>

        {/* Fee structure */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Fee Structure
          </h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Mining hashrate purchases", value: "0% platform fee" },
              { label: "Withdrawal fee", value: "Network fee only (BTC/LTC on-chain)" },
              { label: "Referral commission to referrer", value: "$10 USDT per qualifying friend" },
              { label: "Minimum spend to qualify referral", value: "$50 USD" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Infrastructure */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            Infrastructure
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[
              "Hosted on Google Cloud Run — autoscales to demand",
              "PostgreSQL database via Neon Serverless — replicated across regions",
              "Firebase Authentication — industry-standard auth",
              "Stripe payments — PCI-DSS compliant card processing",
              "All data encrypted in transit (TLS 1.3)",
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <Lock className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* How rewards work */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            How Mining Rewards Work
          </h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <p>
              Miners are virtual hashrate allocations on real BTC and LTC mining pools. Your purchased hashrate runs 24/7 and earnings are credited to your BlockMint wallet daily.
            </p>
            <p>
              Earnings are calculated based on current network difficulty, coin price, and your allocated hashrate. They fluctuate with BTC/LTC market conditions — we never guarantee fixed returns.
            </p>
            <p>
              All rewards are credited in real-time as they are earned. You can withdraw at any time, subject to minimum withdrawal thresholds.
            </p>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}

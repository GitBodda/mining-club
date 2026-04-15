import { motion } from "framer-motion";
import { Zap, Clock, TrendingUp, ArrowLeft, Shield, Info, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { LiveGrowingBalance } from "@/components/LiveGrowingBalance";
import { auth } from "@/lib/firebase";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.dbId || u.id || u.uid || null;
  } catch { return null; }
}

function daysRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface StarterMinerProps {
  onBack?: () => void;
}

export function StarterMiner({ onBack }: StarterMinerProps) {
  const [, navigate] = useLocation();
  const userId = getUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/growth/starter-reward", userId],
    queryFn: async () => {
      if (!userId) return null;
      let token: string | null = null;
      try {
        const user = auth?.currentUser;
        if (user) token = await user.getIdToken();
      } catch (e) {
        console.warn("[StarterMiner] Failed to get auth token:", e);
      }
      const res = await fetch(`/api/growth/starter-reward/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.error("[StarterMiner] Fetch failed:", res.status);
        throw new Error(`Starter reward fetch failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30_000,
    retry: 2,
  });

  const reward = data?.reward;
  const isActive = reward?.status === "active";
  const days = daysRemaining(reward?.expiresAt ?? null);
  const pct  = reward?.progress ?? (() => {
    if (!reward?.activatedAt || !reward?.expiresAt) return 0;
    const total   = new Date(reward.expiresAt).getTime() - new Date(reward.activatedAt).getTime();
    const elapsed = Date.now() - new Date(reward.activatedAt).getTime();
    return Math.min(100, Math.round((elapsed / total) * 100));
  })();

  return (
    <div className="min-h-screen pb-24">
      <ScrollAwareStatusBar />
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack ?? (() => navigate("/growth"))} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Starter Miner</h1>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden border border-orange-500/30 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/25 via-amber-500/10 to-transparent" />
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            {/* Status pill */}
            <div className="flex items-center gap-2 mb-5">
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                isActive ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/10 text-muted-foreground"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
                {isLoading ? "Loading…" : isActive ? "MINING ACTIVE" : reward ? "EXPIRED" : "NOT YET ACTIVE"}
              </span>
            </div>

            {/* Hashrate display */}
            <div className="text-center mb-5">
              <p className="text-5xl font-black bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                {isLoading ? "—" : reward ? `${reward.hashrate}` : "0"}
              </p>
              <p className="text-lg font-semibold text-muted-foreground">TH/s Hashrate</p>
              <p className="text-xs text-muted-foreground mt-1">SHA-256 Cloud Mining · Bitcoin (BTC)</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Duration", value: `${reward?.durationDays ?? 30} days`, icon: <Clock className="w-3.5 h-3.5" /> },
                { label: "Days Left", value: isActive ? `${days}` : "—", icon: <Clock className="w-3.5 h-3.5" /> },
                { label: "Per Day Est.", value: reward ? `${((reward.dailyReturnBtc) * 1e6).toFixed(2)} sats` : "—", icon: <TrendingUp className="w-3.5 h-3.5" /> },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    {s.icon}
                    <span className="text-[10px] uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className="text-sm font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress */}
        {isActive && (
          <GlassCard>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="font-semibold">Mining Period Progress</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started {formatDate(reward?.activatedAt ?? null)}</span>
              <span>Ends {formatDate(reward?.expiresAt ?? null)}</span>
            </div>
          </GlassCard>
        )}

        {/* Total earned */}
        {reward && (
          <GlassCard glow="btc">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estimated Total Earned</p>
                <p className="text-2xl font-black">
                  {((reward.totalEarned ?? 0) * 1e8).toFixed(4)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">sats</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </GlassCard>
        )}

        {/* How it works */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">How the Starter Miner Works</h3>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            {[
              "Every new BlockMint user receives 0.5 TH/s of cloud Bitcoin mining power for 365 days — completely free, no purchase required.",
              "Mining is performed entirely on our cloud infrastructure. Your device is not used for mining — this is a signup reward.",
              "Estimated daily earnings are credited based on current Bitcoin network difficulty. You can earn approximately $16 over the full year.",
              "Upgrade to a paid plan anytime for significantly higher returns. The free miner is a taste of what dedicated hashpower can deliver.",
            ].map((t, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Upgrade CTA */}
        <GlassCard>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Upgrade Your Hashrate</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get 6–30 TH/s with a Pro or Premium plan. Earn up to 50x more than the free tier — real returns you can count on.</p>
            </div>
          </div>
          <Button
            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0"
            onClick={() => navigate("/") /* goes to mining tab via main app */}
          >
            View Mining Plans <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </GlassCard>

        {/* Trust badges */}
        <div className="flex items-center gap-2 justify-center flex-wrap pb-4">
          {["Automatic", "No Credit Card", "Real Hashrate", "BTC Payouts"].map(t => (
            <span key={t} className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-400" /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

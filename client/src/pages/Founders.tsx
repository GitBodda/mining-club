import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, ArrowLeft, ChevronRight, Lock, Star, Shield, Zap, Users, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { FounderBadge } from "@/components/FounderBadge";
import { useToast } from "@/hooks/use-toast";
import { Browser } from '@capacitor/browser';

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.dbId || u.id || null;
  } catch { return null; }
}

async function getToken(): Promise<string | null> {
  try {
    const { getAuth } = await import("firebase/auth");
    const user = getAuth().currentUser;
    return user ? user.getIdToken() : null;
  } catch { return null; }
}

async function loginWithPopup(): Promise<string | null> {
  try {
    await Browser.open({ url: 'https://your-auth-url.com' });
    // Handle redirect and token retrieval here
    return 'token'; // Replace with actual token logic
  } catch (error) {
    console.error('Login failed', error);
    return null;
  }
}

interface FoundersProps {
  onBack?: () => void;
}

const TIER_BENEFITS: Record<string, { label: string; perks: string[] }> = {
  founding: {
    label: "Founding Tier (1–200)",
    perks: [
      "Permanent Founding Member badge on your profile",
      "Priority customer support",
      "Early access to new features",
      "Exclusive Founding Members community",
      "Lower fees when available",
    ],
  },
  early: {
    label: "Early Adopter Tier (201–600)",
    perks: [
      "Early Adopter badge on your profile",
      "Priority customer support",
      "Early access to new features",
    ],
  },
  community: {
    label: "Community Tier (601–1000)",
    perks: [
      "Community Member badge on your profile",
      "Community recognition",
    ],
  },
};

export function Founders({ onBack }: FoundersProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = getUserId();

  // Public founder stats
  const { data: founderStats } = useQuery({
    queryKey: ["/api/growth/founder-stats"],
    queryFn: async () => {
      const res = await fetch("/api/growth/founder-stats");
      return res.ok ? res.json() : null;
    },
    staleTime: 60_000,
  });

  // User's own founder status (if logged in)
  const { data: profile } = useQuery({
    queryKey: ["/api/growth/profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const token = await getToken();
      const res = await fetch(`/api/growth/profile/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.ok ? res.json() : null;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const founderMember = profile?.founder;
  const tier = founderMember?.tier ?? "founding";
  const cap      = founderStats?.cap ?? 500;
  const claimed  = founderStats?.claimed ?? 0;
  const remaining = founderStats?.remaining ?? cap;
  const pct       = founderStats?.pct ?? 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack ?? (() => navigate("/growth"))} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Founding Miners Club</h1>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-purple-500/30 p-6 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent" />
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <Crown className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Founding Miners Club
            </h2>
            <p className="text-sm text-muted-foreground">
              Join the first {cap} miners on BlockMint. Permanent badge. Exclusive benefits.
            </p>
          </div>
        </motion.div>

        {/* User's badge (if founder) */}
        {founderMember && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden border border-purple-500/40 p-5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-500/10" />
            <div className="relative z-10 flex items-center gap-4">
              <FounderBadge sequence={founderMember.sequence} tier={founderMember.tier} size="lg" />
              <div>
                <p className="font-bold">You're a Founding Member!</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {TIER_BENEFITS[founderMember.tier]?.label}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Spots claimed progress */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Founding Spots</h3>
            <span className="text-xs text-muted-foreground">{claimed}/{cap} claimed</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{pct}% filled</span>
            <span className={remaining <= 50 ? "text-orange-400 font-bold" : "text-muted-foreground"}>
              {remaining} spots remaining
            </span>
          </div>
        </GlassCard>

        {/* Tier benefits */}
        {Object.entries(TIER_BENEFITS).map(([t, info]) => {
          const isCurrentTier = tier === t;
          const gradient = t === "founding" ? "from-purple-600 to-pink-500"
            : t === "early" ? "from-blue-500 to-cyan-400"
            : "from-emerald-500 to-teal-400";
          return (
            <GlassCard key={t} className={isCurrentTier ? "border border-purple-500/40" : ""}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{info.label}</p>
                  {isCurrentTier && <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide">Your Tier</span>}
                </div>
              </div>
              <div className="space-y-2">
                {info.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}

        {/* How to qualify */}
        {!founderMember && (
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">How to Qualify</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                "Sign up for BlockMint (automatically gets you a starter miner)",
                "Founding spot is automatically granted to the first 1,000 eligible users",
                "No purchase required – signing up is enough",
                "Founding status is permanent and cannot be transferred",
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0"
              onClick={() => navigate("/")}
            >
              Join BlockMint Now <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </GlassCard>
        )}

        {/* Referral CTA */}
        <GlassCard className="text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold">Help a Friend Become a Founder</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Share your referral link. When friends sign up through your link, they also get a chance at a founding spot.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/30 hover:border-purple-500/50"
            onClick={() => navigate("/referral")}
          >
            Share Referral Link
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}

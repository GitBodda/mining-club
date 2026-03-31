import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ArrowLeft, ChevronRight, Users, Zap, Target, TrendingUp, Clock, Check, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { Browser } from '@capacitor/browser';
import { safeAreaTop } from "@/lib/nativeServices";

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

interface AmbassadorProps {
  onBack?: () => void;
}

const BENEFITS = [
  { icon: Star, label: "Ambassador badge on your profile" },
  { icon: TrendingUp, label: "Higher referral bonuses (when available)" },
  { icon: Users, label: "Dedicated ambassador Slack/Discord channel" },
  { icon: Zap, label: "Early access to new features and beta programs" },
  { icon: Target, label: "Monthly performance reports & leaderboard" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  none:     { label: "Not Applied",  color: "text-muted-foreground", description: "Apply below to become an ambassador." },
  pending:  { label: "Under Review", color: "text-yellow-400",      description: "We're reviewing your application. Expect a decision within 7 days." },
  active:   { label: "Active Ambassador", color: "text-green-400",  description: "You're an active ambassador! Share your link and earn rewards." },
  rejected: { label: "Not Approved", color: "text-red-400",         description: "Your application wasn't approved this time. You can reapply in 30 days." },
};

export function Ambassador({ onBack }: AmbassadorProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getUserId();

  const { data: profile, isLoading } = useQuery({
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

  const applyMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/growth/ambassador/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not submit application");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Application submitted!", description: "We'll review your application within 7 days." });
      queryClient.invalidateQueries({ queryKey: ["/api/growth/profile", userId] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const ambassadorStatus = profile?.user?.ambassadorStatus ?? "none";
  const statusConfig = STATUS_CONFIG[ambassadorStatus] ?? STATUS_CONFIG.none;
  const canApply = !userId || (ambassadorStatus === "none" || ambassadorStatus === "rejected");

  return (
    <div className="min-h-screen pb-24">
      <ScrollAwareStatusBar />
      {/* Fixed header — always visible, never scrolls */}
      <div className="fixed top-0 left-0 right-0 z-[50] bg-background/80 backdrop-blur-xl border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 h-14 flex items-center gap-3">
          <motion.button
            onClick={onBack ?? (() => navigate("/growth"))}
            className="w-11 h-11 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-all"
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold">Ambassador Program</h1>
        </div>
      </div>
      {/* Spacer for fixed header */}
      <div style={{ height: `calc(3.5rem + ${safeAreaTop})` }} />

      <div className="px-4 space-y-5 mt-5">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-orange-500/30 p-6 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-yellow-400/10 to-transparent" />
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Star className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Become an Ambassador
            </h2>
            <p className="text-sm text-muted-foreground">
              Help grow the BlockMint mining community and unlock exclusive rewards & recognition.
            </p>
          </div>
        </motion.div>

        {/* Current status (if logged in) */}
        {userId && (
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">Your Status:</span>
              <span className={`text-sm font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{statusConfig.description}</p>
            {ambassadorStatus === "pending" && (
              <div className="mt-2 flex items-center gap-1.5 text-yellow-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Usually decided within 7 business days</span>
              </div>
            )}
          </GlassCard>
        )}

        {/* Benefits */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">Ambassador Benefits</h3>
          <div className="space-y-3">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Requirements */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">Requirements</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[
              "Be an active BlockMint user",
              "Have made at least one successful referral",
              "Agree to honest, non-spammy promotion practices",
              "Be willing to provide occasional feedback to the team",
            ].map((req, i) => (
              <div key={i} className="flex gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                <span>{req}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">Ambassador status is granted at BlockMint's sole discretion and can be revoked for policy violations.</span>
          </div>
        </GlassCard>

        {/* How it works */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">How It Works</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Apply using the button below" },
              { step: "2", text: "Our team reviews your profile and activity" },
              { step: "3", text: "Approved ambassadors get a badge + tools + exclusive rewards" },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 text-sm text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* CTA */}
        {!userId
          ? (
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0"
              onClick={() => navigate("/auth")}
            >
              Sign Up to Apply <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )
          : canApply
            ? (
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? "Submitting…" : "Apply to Become an Ambassador"}
                {!applyMutation.isPending && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            )
            : null
        }
      </div>
    </div>
  );
}

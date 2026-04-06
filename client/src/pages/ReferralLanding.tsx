import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { Cpu, Gift, Users, ChevronRight, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

/**
 * Client-side referral landing page at /r/:code
 * - Reads the referral code from the URL
 * - Stores it in localStorage for pickup in AuthPage
 * - Shows a branded invite page
 * - Button navigates to /auth?ref=CODE
 */
export function ReferralLanding() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const code = params.code ?? "";

  // Immediate localStorage save
  useEffect(() => {
    if (code) {
      localStorage.setItem("ref", code);
    }
  }, [code]);

  // optional: fetch referrer display name
  const { data: referrerInfo } = useQuery({
    queryKey: ["/api/growth/referral-info", code],
    queryFn: async () => {
      if (!code) return null;
      const res = await fetch(`/api/growth/referral-info/${encodeURIComponent(code)}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!code,
    staleTime: 300_000,
  });

  const referrerName: string = referrerInfo?.displayName ?? "A BlockMint miner";
  const isFounder: boolean = referrerInfo?.isFounder ?? false;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-orange-950/20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6 text-center">

        {/* Logo / brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center shadow-2xl shadow-orange-500/30">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black">BlockMint</h1>
          <p className="text-xs text-muted-foreground">Bitcoin mining, made simple.</p>
        </motion.div>

        {/* Invitation card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden border border-orange-500/30 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 to-yellow-400/5" />
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground mb-1">You've been invited by</p>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <p className="text-lg font-black">{referrerName}</p>
              {isFounder && (
                <Crown className="w-4 h-4 text-purple-400" aria-label="Founding Member" />
              )}
            </div>

            <div className="space-y-2 text-left mb-5">
              {[
                { icon: Gift,  text: "Get a free 0.5 TH/s starter miner" },
                { icon: Cpu,   text: "Earn real Bitcoin for 365 days" },
                { icon: Users, text: "Refer friends and earn $10 USDT each" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-orange-400" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0 h-12 text-base font-bold shadow-lg shadow-orange-500/30"
              onClick={() => {
                localStorage.setItem("ref", code);
                window.location.href = "https://apps.apple.com/us/app/blockmint-node-manager/id6757912571";
              }}
            >
              Download BlockMint <ChevronRight className="w-5 h-5 ml-1" />
            </Button>

            <p className="text-[10px] text-muted-foreground mt-3">
              No credit card required. Free for 365 days.
            </p>
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground">
          By signing up you agree to BlockMint's Terms of Service. Mining rewards fluctuate with BTC market conditions.
        </p>
      </div>
    </div>
  );
}

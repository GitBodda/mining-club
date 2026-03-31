import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertCircle, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { GlassCard } from "@/components/GlassCard";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { safeAreaTop } from "@/lib/nativeServices";

interface ReferralTermsProps {
  onBack?: () => void;
}

export function ReferralTerms({ onBack }: ReferralTermsProps) {
  const [, navigate] = useLocation();

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
          <h1 className="text-lg font-bold">Referral Terms</h1>
        </div>
      </div>
      {/* Spacer for fixed header */}
      <div style={{ height: `calc(3.5rem + ${safeAreaTop})` }} />

      <div className="px-4 space-y-5 mt-5">

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-white/10 p-6 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-transparent" />
          <div className="relative z-10">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h2 className="text-lg font-bold">Referral Program Terms</h2>
            <p className="text-xs text-muted-foreground mt-1">Effective from launch. Subject to change with notice.</p>
          </div>
        </motion.div>

        {/* Key facts */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">The Key Numbers</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Reward per qualifying referral", value: "$10 USDT" },
              { label: "Minimum friend spend to qualify", value: "$50 USD" },
              { label: "Max referrals per account", value: "Unlimited" },
              { label: "Reward currency", value: "USDT (credited to BlockMint wallet)" },
              { label: "Reward payment timing", value: "Automatic, within minutes of qualification" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="text-xs font-bold">{value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* What qualifies */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">What Counts as a Qualifying Referral</h3>
          <div className="space-y-2">
            {[
              "Friend signs up via your unique referral link (https://blockmint.app/r/YOUR_CODE)",
              "Friend has never had a BlockMint account before",
              "Friend makes a cumulative purchase of $50 USD or more",
              "Friend's payment clears and is not refunded",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* What does NOT qualify */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">What Does NOT Qualify</h3>
          <div className="space-y-2">
            {[
              "Referring yourself or household members to the same purchase",
              "Creating fake or duplicate accounts",
              "Purchasing and then requesting a refund",
              "Using automated bots, bulk email blasts, or paid ads without permission",
              "Spreading false claims about BlockMint to obtain sign-ups",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Anti-abuse */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <h3 className="font-semibold text-sm">Anti-Abuse Policy</h3>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              BlockMint uses automated and manual fraud detection. Accounts found to be abusing the referral program will have rewards clawed back and may be permanently suspended.
            </p>
            <p>
              We reserve the right to withhold rewards if we reasonably suspect fraud, even if we cannot confirm it with certainty.
            </p>
            <p>
              We reserve the right to modify or discontinue the referral program at any time. Existing earned rewards will not be clawed back unless fraud is confirmed.
            </p>
          </div>
        </GlassCard>

        {/* Payout */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-2">Reward Payout Details</h3>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>Rewards are credited as USDT to your BlockMint in-app wallet. They can be withdrawn subject to standard withdrawal minimums and network fees.</p>
            <p>Rewards are not transferable and have no cash value outside the BlockMint platform.</p>
          </div>
        </GlassCard>

        {/* Contact */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          Questions? Contact us at <span className="text-foreground font-medium">support@blockmint.app</span>
        </div>

      </div>
    </div>
  );
}

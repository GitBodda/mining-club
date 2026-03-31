import { motion } from "framer-motion";
import { ArrowLeft, Cpu, Gift, Users, Crown, Star, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { safeAreaTop } from "@/lib/nativeServices";

interface HowItWorksProps {
  onBack?: () => void;
}

const STEPS = [
  {
    icon: Gift,
    color: "from-green-500 to-emerald-400",
    title: "Sign Up & Get a Free Starter Miner",
    description:
      "Create a BlockMint account. Instantly get 0.5 TH/s of free Bitcoin mining hashrate — no purchase needed.",
  },
  {
    icon: Cpu,
    color: "from-blue-500 to-cyan-400",
    title: "Your Miner Runs 24/7",
    description:
      "Your starter miner is active for 365 days. It earns real BTC accumulated in your BlockMint wallet as long as it is active.",
  },
  {
    icon: Users,
    color: "from-purple-500 to-pink-400",
    title: "Invite Friends & Earn $10",
    description:
      "Share your unique referral link. When a friend signs up and spends $50 or more, you earn $10 USDT — automatically credited to your wallet.",
  },
  {
    icon: Crown,
    color: "from-yellow-500 to-orange-400",
    title: "Founding Miners Club",
    description:
      "The first 1,000 users to join BlockMint earn a permanent Founding Member badge and exclusive benefits. Spots are first-come, first-served.",
  },
  {
    icon: Star,
    color: "from-orange-500 to-red-400",
    title: "Ambassador Program",
    description:
      "Active community members can apply to become official BlockMint ambassadors, unlocking higher rewards, a dedicated badge, and exclusive tools.",
  },
];

export function HowItWorks({ onBack }: HowItWorksProps) {
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
          <h1 className="text-lg font-bold">How It Works</h1>
        </div>
      </div>
      {/* Spacer for fixed header */}
      <div style={{ height: `calc(3.5rem + ${safeAreaTop})` }} />

      <div className="px-4 space-y-5 mt-5">

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-black mb-2">Start mining in seconds.</h2>
          <p className="text-sm text-muted-foreground">
            BlockMint is designed to be simple, transparent, and rewarding. Here's everything you need to know.
          </p>
        </motion.div>

        {/* Steps */}
        {STEPS.map(({ icon: Icon, color, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-bold">Step {i + 1}</span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* FAQ */}
        <GlassCard>
          <h3 className="font-semibold text-sm mb-3">Common Questions</h3>
          <div className="space-y-4 text-xs text-muted-foreground">
            <div>
              <p className="text-foreground font-medium mb-1">Is the starter miner real?</p>
              <p>Yes. It is 0.5 TH/s of real hashrate allocated to real BTC mining pools. You actually earn BTC during the 365-day period.</p>
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">When does my referral reward arrive?</p>
              <p>Immediately after your referral completes a $50+ spend. The $10 USDT is credited to your BlockMint wallet automatically — no waiting, no manual approval.</p>
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">Can I refer myself or create fake accounts?</p>
              <p>No. Self-referrals are automatically blocked. Anti-fraud checks are in place and abuse results in permanent account suspension.</p>
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">Can I lose my Founding Member status?</p>
              <p>Founding Member status is permanent. It cannot be removed (except for TOS violations) and it cannot be transferred or sold.</p>
            </div>
          </div>
        </GlassCard>

        {/* CTA */}
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0"
          onClick={() => navigate("/auth")}
        >
          Get Started Now <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

      </div>
    </div>
  );
}

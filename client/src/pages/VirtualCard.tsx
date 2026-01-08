import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Shield, Zap, Globe, Lock, TrendingUp, Check, Mail } from "lucide-react";
import { GlassCard, LiquidGlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface VirtualCardProps {
  onBack?: () => void;
}

const features = [
  {
    icon: CreditCard,
    title: "Instant Virtual Card",
    description: "Get your card instantly after approval. No waiting, no hassle.",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Advanced encryption and fraud protection keep your funds safe 24/7.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Zap,
    title: "Zero Hidden Fees",
    description: "No monthly fees, no annual fees. Only transparent transaction costs.",
    color: "from-amber-500 to-orange-500"
  },
  {
    icon: Globe,
    title: "Global Acceptance",
    description: "Use anywhere Visa/Mastercard is accepted. Online and in-store.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Lock,
    title: "Crypto to Fiat",
    description: "Seamlessly convert and spend your crypto holdings as traditional currency.",
    color: "from-rose-500 to-red-500"
  },
  {
    icon: TrendingUp,
    title: "Cashback Rewards",
    description: "Earn up to 3% cashback in crypto on every purchase you make.",
    color: "from-cyan-500 to-blue-500"
  }
];

const comparisons = [
  { feature: "Instant Issuance", blockmint: true, traditional: false, competitors: false },
  { feature: "Crypto Integration", blockmint: true, traditional: false, competitors: true },
  { feature: "No Monthly Fees", blockmint: true, traditional: false, competitors: false },
  { feature: "3% Cashback", blockmint: true, traditional: false, competitors: false },
  { feature: "Global Acceptance", blockmint: true, traditional: true, competitors: true },
  { feature: "24/7 Support", blockmint: true, traditional: false, competitors: true },
  { feature: "Multi-Currency", blockmint: true, traditional: false, competitors: true },
  { feature: "No Credit Check", blockmint: true, traditional: false, competitors: false },
];

export function VirtualCard({ onBack }: VirtualCardProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Welcome to the Waitlist! 🎉",
        description: "You'll be among the first to get early access to BlockMint Virtual Card.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5"
      >
        <div className="flex items-center gap-3 p-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center liquid-glass hover-elevate"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">BlockMint Virtual Card</h1>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </div>
        </div>
      </motion.header>

      <div className="p-4 space-y-6">
        {/* Hero Section with Lottie Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LiquidGlassCard className="relative overflow-hidden" variant="strong">
            {/* Content */}
            <div className="relative z-10 p-4 text-center">
              {/* BlockMint Logo - Shows First */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 100 }}
                className="mb-3"
              >
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 rounded-full blur-xl"></div>
                  <img 
                    src="/attached_assets/BlockMint-for-All.png" 
                    alt="BlockMint" 
                    className="w-full h-full object-contain relative z-10"
                    style={{
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 15px rgba(16, 185, 129, 0.25)) contrast(1.1) saturate(1.2)',
                    }}
                  />
                </div>
              </motion.div>
              
              {/* High Quality Lottie Animation - Shows Second */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100 }}
                className="mb-3"
              >
                <div className="w-72 h-72 mx-auto max-w-full">
                  <DotLottieReact
                    src="https://lottie.host/4495e92b-9f73-41a6-9a64-d28398d29566/vSLht88QDu.lottie"
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </motion.div>

              {/* Text Content - Shows After Lottie */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  The Future of Crypto Payments
                </h2>
                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                  Spend your crypto earnings anywhere, anytime. The revolutionary BlockMint Virtual Card is almost here.
                </p>
              </motion.div>

              {/* Waitlist Form - Shows After Text */}
              <motion.form
                onSubmit={handleJoinWaitlist}
                className="max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 liquid-glass border-primary/20"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Be the first to know when we launch and get exclusive early access benefits
                </p>
              </motion.form>
            </div>
          </LiquidGlassCard>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-4">Why BlockMint Virtual Card?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <GlassCard className="p-5 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-4">How We Compare</h3>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Feature</th>
                    <th className="text-center p-3 text-sm font-semibold text-primary">BlockMint</th>
                    <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Traditional Banks</th>
                    <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Competitors</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, index) => (
                    <tr key={row.feature} className="border-b border-white/5">
                      <td className="p-3 text-sm text-foreground">{row.feature}</td>
                      <td className="text-center p-3">
                        {row.blockmint ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xl">—</span>
                        )}
                      </td>
                      <td className="text-center p-3">
                        {row.traditional ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xl">—</span>
                        )}
                      </td>
                      <td className="text-center p-3">
                        {row.competitors ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-muted-foreground text-xl">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <LiquidGlassCard className="p-8 text-center" variant="strong" glow="btc">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Ready to Transform Your Crypto Spending?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join thousands of early adopters on the waitlist and be among the first to experience the future of payments.
            </p>
            <form onSubmit={handleJoinWaitlist} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 liquid-glass border-primary/20"
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  {isSubmitting ? "Processing..." : "Join Now"}
                </Button>
              </div>
            </form>
          </LiquidGlassCard>
        </motion.div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Early Access Benefits</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Priority Approval:</strong> Skip the queue and get your card first
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Exclusive Perks:</strong> 5% cashback for the first 3 months
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Lifetime Benefits:</strong> Waived annual fees forever as an early adopter
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Beta Access:</strong> Test new features before they go public
                </span>
              </li>
            </ul>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

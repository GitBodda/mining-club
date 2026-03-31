import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Share2, Copy, Users, Trophy, Gift, 
  Star, DollarSign, Check, Clock, Info, ChevronRight,
  Crown, Medal, Wallet, ChevronDown, ChevronUp, CheckCircle2, ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ReferralProps {
  userId?: string | null;
}

export function Referral({ userId }: ReferralProps) {
  const { toast } = useToast();
  const { convert, getSymbol } = useCurrency();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [walletType, setWalletType] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState("");
  
  // Get userId from localStorage if not passed
  const effectiveUserId = userId || localStorage.getItem("userId");

  // Fetch referral stats from API
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/referral/stats", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const res = await fetch(`/api/referral/stats/${effectiveUserId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!effectiveUserId,
  });

  // Fetch referral code
  const { data: codeData } = useQuery({
    queryKey: ["/api/referral/code", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const res = await fetch(`/api/referral/code/${effectiveUserId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!effectiveUserId,
  });

  // Save wallet mutation
  const saveWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/referral/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: effectiveUserId, walletType, walletAddress }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet Saved", description: "Your payout wallet has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/referral/stats"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const referralCode = codeData?.code || "Loading...";
  const publicBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL || "https://hardisk.co";
  const referralLink = codeData?.code
    ? `${publicBaseUrl}/r/${codeData.code}`
    : "";
  const myReferrals = stats?.totalReferrals || 0;
  const myEarnings = stats?.totalEarnings || 0;
  const pendingEarnings = stats?.pendingEarnings || 0;
  const rewardPerReferral = 5;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share it with your friends to earn rewards.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Mining Club",
          text: `Join Mining Club and start earning Bitcoin! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 max-w-md mx-auto px-4 pt-16 pb-8 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.header
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl liquid-glass flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Refer & Earn</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Get ${rewardPerReferral} cash per friend</p>
            </div>
          </div>
        </motion.header>

        {/* Hero Card */}
        <GlassCard delay={0.1} className="p-5 overflow-visible bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/30" glow="primary">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Invite Friends & Earn Cash</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Get <span className="text-emerald-400 font-semibold">${rewardPerReferral}</span> for each friend who buys $100+ hashrate
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 rounded-xl border border-white/10">
                <p className="text-2xl font-bold text-foreground" data-testid="text-my-referrals">{myReferrals}</p>
                <p className="text-xs text-muted-foreground">Your Referrals</p>
              </div>
              <div className="text-center p-3 rounded-xl border border-white/10">
                <p className="text-2xl font-bold text-emerald-400" data-testid="text-my-earnings">${myEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Pending Earnings Alert */}
        {pendingEarnings > 0 && (
          <GlassCard delay={0.12} className="p-4 bg-amber-500/10 border-amber-500/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-amber-400">${pendingEarnings.toFixed(2)} Pending</p>
                <p className="text-xs text-muted-foreground">Will be sent to your wallet soon</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Referral Link Card */}
        <GlassCard delay={0.15} className="p-5">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Your Referral Link
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-white/10">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-foreground truncate outline-none font-mono"
                data-testid="input-referral-link"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Referral Code Display */}
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
              <p className="font-mono font-bold text-primary">{referralCode}</p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleShare}
                data-testid="button-share"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Share Link
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyLink}
                data-testid="button-copy"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Wallet Setup Card */}
        <GlassCard delay={0.18} className="p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-primary" />
            Payout Wallet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your wallet to receive referral rewards. No minimum withdrawal!
          </p>
          
          {stats?.walletAddress ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-400">
                  {stats.walletType === "trc20" ? "USDT TRC20" : "Binance Pay"}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {stats.walletAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Wallet Type</Label>
                <Select value={walletType} onValueChange={setWalletType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select wallet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trc20">USDT TRC20 (TRON)</SelectItem>
                    <SelectItem value="binance_pay">Binance Pay ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">
                  {walletType === "trc20" ? "TRC20 Wallet Address" : 
                   walletType === "binance_pay" ? "Binance Pay ID" : 
                   "Wallet Address"}
                </Label>
                <Input 
                  className="mt-1"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={
                    walletType === "trc20" ? "TXxxxxxx..." : 
                    walletType === "binance_pay" ? "12345678" : 
                    "Select wallet type first"
                  }
                  disabled={!walletType}
                />
                {walletType === "trc20" && (
                  <p className="text-xs text-muted-foreground mt-1">Must start with T (TRON network)</p>
                )}
                {walletType === "binance_pay" && (
                  <p className="text-xs text-muted-foreground mt-1">8-9 digit Binance Pay ID</p>
                )}
              </div>
              <Button 
                className="w-full"
                disabled={!walletType || !walletAddress || saveWalletMutation.isPending}
                onClick={() => saveWalletMutation.mutate()}
              >
                {saveWalletMutation.isPending ? "Saving..." : "Save Wallet"}
              </Button>
            </div>
          )}
        </GlassCard>

        {/* How It Works FAQ */}
        <GlassCard delay={0.2} className="p-5">
          <button 
            className="w-full flex items-center justify-between"
            onClick={() => setShowFaq(!showFaq)}
          >
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              How It Works
            </h3>
            {showFaq ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {showFaq && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Share Your Link</p>
                    <p className="text-sm text-muted-foreground">Send your unique referral link to friends and family</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Friend Signs Up & Buys</p>
                    <p className="text-sm text-muted-foreground">They create an account and purchase $100+ in hashrate</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-400">Get $5 Cash</p>
                    <p className="text-sm text-muted-foreground">Reward is sent directly to your USDT or Binance wallet</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-medium mb-3 text-foreground">Referral Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Friend must be a new user (never registered)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>They must purchase at least $100 in hashrate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>No minimum withdrawal - instant payout!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Unlimited referrals - no cap on earnings!</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Recent Referrals */}
        {stats?.referrals?.length > 0 && (
          <GlassCard delay={0.25} className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Recent Referrals</h3>
            <div className="space-y-2">
              {stats.referrals.slice(0, 5).map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {ref.referredEmail ? `${ref.referredEmail.split("@")[0]}***` : "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ref.status === "rewarded" ? "bg-emerald-500/20 text-emerald-400" :
                    ref.status === "qualified" ? "bg-amber-500/20 text-amber-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {ref.status === "rewarded" ? "Paid" :
                     ref.status === "qualified" ? "Qualified" :
                     "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            By participating, you agree to our{" "}
            <Link href="/privacy" data-testid="link-terms">
              <span className="text-primary hover:underline">Terms of Service</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Referral;

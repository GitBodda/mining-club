import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, Users, Crown, Star, ChevronRight, Share2,
  Gift, TrendingUp, Shield, Copy, Check,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StarterMinerCard } from "@/components/StarterMinerCard";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { iOS26Toolbar, iOS26TabBar } from "@/components/ios26";
import { ScrollEdgeBlur } from "@/components/ios26";
import { auth } from "@/lib/firebase";

const PUBLIC_URL = import.meta.env.VITE_PUBLIC_APP_URL || "https://hardisk.co";

function getUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.dbId || u.id || u.uid || null;
  } catch {
    return null;
  }
}

interface GrowthHubProps {
  onBack?: () => void;
}

export function GrowthHub({ onBack }: GrowthHubProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const userId = getUserId();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/growth/profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      let token: string | null = null;
      try {
        const user = auth?.currentUser;
        if (user) token = await user.getIdToken();
      } catch (e) {
        console.warn("[GrowthHub] Failed to get auth token:", e);
      }
      const res = await fetch(`/api/growth/profile/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.error("[GrowthHub] Profile fetch failed:", res.status, await res.text().catch(() => ""));
        throw new Error(`Profile fetch failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60_000,
    retry: 2,
  });

  // Fetch referral code using the auto-generating endpoint (creates one if none exists)
  const { data: referralData } = useQuery({
    queryKey: ["/api/referral/code", userId],
    queryFn: async () => {
      const res = await fetch(`/api/referral/code/${userId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
    staleTime: 300_000,
    retry: 3,
  });

  const referralCode = profile?.referral?.referralCode || referralData?.code || "";
  const referralLink = referralCode ? `${PUBLIC_URL}/r/${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Link Copied!", description: "Share it to earn $10 per qualified referral." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const shareText = `I'm mining Bitcoin with BlockMint — cloud mining, zero hardware. Join free and get your own starter miner:`;
  const encodedText = encodeURIComponent(shareText);
  const encodedLink = encodeURIComponent(referralLink);

  const shareToX = () => window.open(`https://x.com/intent/tweet?text=${encodedText}&url=${encodedLink}`, "_blank");
  const shareToFarcaster = () => window.open(`https://warpcast.com/~/compose?text=${encodedText}%20${encodedLink}`, "_blank");
  const shareToBluesky = () => window.open(`https://bsky.app/intent/compose?text=${encodedText}%20${encodedLink}`, "_blank");

  const pillars = [
    {
      icon: <Zap className="w-5 h-5" />,
      label: "Starter Miner",
      desc: "Your free 0.5 TH/s cloud miner",
      color: "from-orange-500 to-amber-400",
      href: "/growth/starter",
      badge: profile?.starterReward?.status === "active" ? "ACTIVE" : undefined,
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Refer & Earn",
      desc: `$10 per qualified invite · ${profile?.referral?.totalReferrals ?? 0} sent`,
      color: "from-blue-500 to-cyan-400",
      href: "/referral",
      badge: profile?.referral?.totalEarnings > 0 ? `$${profile.referral.totalEarnings}` : undefined,
    },
    {
      icon: <Crown className="w-5 h-5" />,
      label: "Founding Miners Club",
      desc: profile?.founder ? `Member #${profile.founder.sequence}` : `${profile?.founderStats?.remaining ?? "—"} spots left`,
      color: "from-purple-500 to-pink-400",
      href: "/founders",
      badge: profile?.founder ? profile.founder.tier : undefined,
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: "Ambassador Program",
      desc: profile?.user?.isAmbassador ? "Active ambassador" : "Apply for higher tier perks",
      color: "from-emerald-500 to-teal-400",
      href: "/ambassador",
      badge: profile?.user?.ambassadorStatus === "active" ? "ACTIVE" : undefined,
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      <ScrollAwareStatusBar />
      <ScrollEdgeBlur />
      {/* iOS 26 Toolbar */}
      <iOS26Toolbar
        title="Growth Hub"
        variant="largeTitle"
        showBack
        showDefaultActions
        onBack={onBack ?? (() => navigate("/"))}
      />

      <div className="px-4 space-y-5 mt-5">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-600/20 via-amber-500/10 to-transparent border border-orange-500/20 px-5 py-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-purple-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Growth Hub</span>
            </div>
            <h2 className="text-xl font-bold mb-0.5">Mine. Share. Grow.</h2>
            <p className="text-xs text-muted-foreground">
              Your free miner is live. Invite friends, earn rewards, and secure your founder spot.
            </p>
          </div>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
        </motion.div>

        {/* Starter miner card */}
        {isLoading ? (
          <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        ) : (
          <StarterMinerCard
            starterReward={profile?.starterReward}
            onViewDetails={() => navigate("/growth/starter")}
          />
        )}

        {/* Referral Link Section */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Your Referral Link</h3>
            <span className="text-xs text-muted-foreground">Earn $10 per referral</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 text-xs text-foreground truncate font-mono border border-white/10">
              {referralLink || "Loading your link..."}
            </div>
            <Button size="sm" variant="outline" className="shrink-0 h-9" onClick={handleCopy} disabled={!referralLink}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {referralLink && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Share and boost your earnings & ranking:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 hover:bg-white/5" onClick={shareToX}>
                  <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Post on X
                </Button>
                <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 hover:bg-white/5" onClick={shareToFarcaster}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Farcaster
                </Button>
                <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 hover:bg-white/5" onClick={shareToBluesky}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Bluesky
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/70 text-center">
                Sharing helps you climb the leaderboard and increases your referral earnings.
              </p>
            </div>
          )}
        </GlassCard>

        {/* Badges */}
        {profile?.badges?.length > 0 && (
          <GlassCard className="space-y-3">
            <h3 className="font-semibold text-sm">Your Badges</h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b: any) => (
                <BadgeChip key={b.badgeSlug} slug={b.badgeSlug} name={b.badgeName} />
              ))}
            </div>
          </GlassCard>
        )}

        {/* Feature pillars grid */}
        <div className="grid grid-cols-2 gap-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <Link href={p.href}>
                <div className="relative rounded-2xl p-4 bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer group overflow-hidden">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white mb-3`}>
                    {p.icon}
                  </div>
                  {p.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wide">
                      {p.badge}
                    </span>
                  )}
                  <p className="text-sm font-semibold leading-tight">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{p.desc}</p>
                  <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Shield className="w-4 h-4" />, label: "How It Works", href: "/how-it-works" },
            { icon: <TrendingUp className="w-4 h-4" />, label: "Transparency", href: "/transparency" },
            { icon: <Gift className="w-4 h-4" />, label: "Referral Terms", href: "/referral-terms" },
          ].map(({ icon, label, href }) => (
            <Link key={label} href={href}>
              <div className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center cursor-pointer">
                <div className="flex justify-center mb-1 text-muted-foreground">{icon}</div>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <iOS26TabBar
        tabs={[
          { id: "home", icon: <i className="fi fi-tr-house-window" style={{ fontSize: 18, lineHeight: 1 }} />, label: "Home" },
          { id: "wallet", icon: <i className="fi fi-tr-wallet" style={{ fontSize: 18, lineHeight: 1 }} />, label: "Wallet" },
          { id: "invest", icon: <i className="fi fi-tr-growth-chart-invest" style={{ fontSize: 18, lineHeight: 1 }} />, label: "Yield" },
          { id: "mining", icon: <i className="fi fi-tr-pickaxe" style={{ fontSize: 18, lineHeight: 1 }} />, label: "Mining" },
          { id: "solo", icon: <i className="fi fi-tr-bullseye-arrow" style={{ fontSize: 18, lineHeight: 1 }} />, label: "Solo" },
        ]}
        activeTab="home"
        onTabChange={(id: string) => navigate("/")}
      />
    </div>
  );
}

// Badge chip sub-component
function BadgeChip({ slug, name }: { slug: string; name: string }) {
  const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
    starter_miner: { color: "from-orange-500 to-amber-400", icon: <Zap className="w-3 h-3" /> },
    founder:       { color: "from-purple-600 to-pink-500", icon: <Crown className="w-3 h-3" /> },
    first_referral:{ color: "from-blue-500 to-cyan-400", icon: <Users className="w-3 h-3" /> },
    ambassador:    { color: "from-emerald-500 to-teal-400", icon: <Star className="w-3 h-3" /> },
  };
  const c = cfg[slug] ?? { color: "from-gray-500 to-gray-400", icon: <Shield className="w-3 h-3" /> };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${c.color} bg-opacity-20 text-white text-xs font-medium`}>
      {c.icon}
      <span>{name}</span>
    </div>
  );
}

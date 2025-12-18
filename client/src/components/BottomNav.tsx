import { motion } from "framer-motion";
import { Home, Wallet, TrendingUp, Pickaxe, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "home" | "wallet" | "invest" | "mining" | "solo";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "wallet" as const, icon: Wallet, label: "Wallet" },
  { id: "invest" as const, icon: TrendingUp, label: "Invest" },
  { id: "mining" as const, icon: Pickaxe, label: "Mining" },
  { id: "solo" as const, icon: Gem, label: "Solo" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <motion.nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "mx-2 mb-2",
        "rounded-[28px]",
        "bg-white/[0.08] dark:bg-white/[0.06]",
        "backdrop-blur-2xl",
        "border border-white/[0.12]",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      )}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
    >
      <div 
        className="absolute inset-x-0 top-0 h-[1px] rounded-t-[28px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />
      
      <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              data-testid={`nav-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center",
                "w-14 h-14 rounded-2xl",
                "transition-all duration-300 ease-out",
                "relative"
              )}
              whileTap={{ scale: 0.92 }}
              animate={isActive ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -inset-3 rounded-2xl bg-primary/25 blur-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute -inset-2 rounded-xl bg-primary/15"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  className={cn(
                    "w-6 h-6 relative z-10 transition-all duration-200",
                    isActive 
                      ? "text-primary stroke-[2.5px] drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
                      : "text-muted-foreground stroke-[1.5px]"
                  )} 
                  fill={isActive ? "hsl(var(--primary) / 0.15)" : "none"}
                />
              </div>
              <motion.span 
                className={cn(
                  "text-[10px] mt-1.5 font-bold tracking-wide transition-colors duration-200",
                  isActive ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "text-foreground/70"
                )}
                animate={isActive ? { opacity: 1 } : { opacity: 0.85 }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export type { TabType };

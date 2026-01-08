import { motion } from "framer-motion";
import { Home, Wallet, TrendingUp, Pickaxe, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "home" | "wallet" | "invest" | "mining" | "solo" | "admin";

export type { TabType };

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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
      <motion.nav
        className={cn(
          "pointer-events-auto w-full max-w-md mx-4 mb-4",
          "rounded-3xl",
          "dark:bg-white/[0.08] bg-white/95",
          "backdrop-blur-2xl",
          "dark:border-white/[0.15] border border-border/50",
          "dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.12)] shadow-[0_-4px_20px_rgba(0,0,0,0.1),0_2px_10px_rgba(0,0,0,0.05)]"
        )}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
      >
        <div 
          className="absolute inset-x-0 top-0 h-[1px] rounded-t-3xl bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden="true"
        />
        
        <div className="flex items-center justify-around px-2 h-16">
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
              whileTap={{ scale: 0.90 }}
              animate={isActive ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlass"
                  className="absolute inset-0 rounded-2xl bg-white/[0.12] dark:bg-white/[0.08] backdrop-blur-xl border border-white/[0.2] dark:border-white/[0.15] shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon 
                className={cn(
                  "w-7 h-7 relative z-10 transition-all duration-200",
                  isActive 
                    ? "text-primary stroke-[2.5px]" 
                    : "text-muted-foreground/70 stroke-[1.8px]"
                )} 
                fill={isActive ? "hsl(var(--primary) / 0.15)" : "none"}
              />
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
    </div>
  );
}

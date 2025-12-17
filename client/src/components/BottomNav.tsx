import { motion } from "framer-motion";
import { Home, Wallet, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "home" | "wallet" | "mining" | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "wallet" as const, icon: Wallet, label: "Wallet" },
  { id: "mining" as const, icon: Activity, label: "Mining" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <motion.nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "h-20 pb-safe",
        "bg-gradient-to-t from-background via-background/95 to-background/80",
        "backdrop-blur-xl",
        "border-t border-white/[0.05]"
      )}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex items-center justify-around h-full px-4 max-w-md mx-auto">
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
                "w-16 h-14 rounded-xl",
                "transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-2 bg-primary/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "w-6 h-6 relative z-10",
                  isActive && "stroke-[2.5px]"
                )} />
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export type { TabType };

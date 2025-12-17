import { motion } from "framer-motion";
import { Power, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiningButtonProps {
  isActive: boolean;
  isPending?: boolean;
  onToggle: () => void;
}

export function MiningButton({ isActive, isPending = false, onToggle }: MiningButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ margin: "-20px" }}
        />
      )}
      
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ margin: "-30px" }}
        />
      )}

      <motion.button
        data-testid="button-mining-toggle"
        onClick={onToggle}
        disabled={isPending}
        className={cn(
          "relative w-28 h-28 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-300",
          "shadow-lg",
          isActive
            ? "bg-gradient-to-br from-primary via-purple-500 to-violet-600 shadow-primary/40"
            : "bg-gradient-to-br from-gray-700 to-gray-800 shadow-gray-900/50",
          isPending && "opacity-70 cursor-not-allowed"
        )}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
      >
        <div
          className={cn(
            "absolute inset-1 rounded-full",
            "bg-gradient-to-br",
            isActive
              ? "from-primary/80 to-violet-700"
              : "from-gray-600 to-gray-700"
          )}
        />
        
        <div
          className={cn(
            "relative z-10 flex items-center justify-center",
            "w-20 h-20 rounded-full",
            "bg-gradient-to-br",
            isActive
              ? "from-primary to-purple-600"
              : "from-gray-500 to-gray-600"
          )}
        >
          {isPending ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : (
            <Power
              className={cn(
                "w-10 h-10 transition-colors",
                isActive ? "text-white" : "text-gray-300"
              )}
            />
          )}
        </div>
      </motion.button>

      <motion.p
        className={cn(
          "absolute -bottom-10 text-sm font-medium",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={isActive ? "active" : "inactive"}
      >
        {isPending ? "Processing..." : isActive ? "Mining Active" : "Tap to Start"}
      </motion.p>
    </div>
  );
}

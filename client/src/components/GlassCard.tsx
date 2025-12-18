import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  glow?: "btc" | "ltc" | "primary" | "none";
  variant?: "default" | "strong" | "subtle";
}

export function GlassCard({ 
  children, 
  className, 
  animate = true, 
  delay = 0,
  glow = "none",
  variant = "default"
}: GlassCardProps) {
  const glowClass = glow === "btc" ? "glass-glow-btc" : glow === "ltc" ? "glass-glow-ltc" : glow === "primary" ? "glass-glow-primary" : "";
  const variantClass = variant === "strong" ? "liquid-glass-strong" : variant === "subtle" ? "liquid-glass-subtle" : "";
  
  const content = (
    <div
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden",
        "liquid-glass",
        variantClass,
        glowClass,
        className
      )}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
    >
      {content}
    </motion.div>
  );
}

export function LiquidGlassCard(props: GlassCardProps) {
  return <GlassCard {...props} />;
}

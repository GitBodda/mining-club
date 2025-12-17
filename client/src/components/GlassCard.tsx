import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  glow?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  animate = true, 
  delay = 0,
  glow = false 
}: GlassCardProps) {
  const content = (
    <div
      className={cn(
        "relative rounded-2xl p-6",
        "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
        "backdrop-blur-xl",
        "border border-white/[0.08]",
        glow && "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
        className
      )}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
    >
      {content}
    </motion.div>
  );
}

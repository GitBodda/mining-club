import { motion } from "framer-motion";
import { Wifi, Signal, BatteryFull } from "lucide-react";

export function IOSStatusBar() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }).replace(' ', '');

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-[100] h-12 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-foreground">{timeString}</span>
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5">
        <div className="w-28 h-7 bg-black rounded-full" />
      </div>
      
      <div className="flex items-center gap-1.5">
        <Signal className="w-4 h-4 text-foreground" />
        <Wifi className="w-4 h-4 text-foreground" />
        <div className="flex items-center gap-0.5">
          <BatteryFull className="w-5 h-5 text-foreground" />
          <span className="text-xs font-medium text-foreground">100</span>
        </div>
      </div>
    </motion.div>
  );
}

export function IOSHomeIndicator() {
  return (
    <motion.div 
      className="fixed bottom-1 left-1/2 -translate-x-1/2 z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="w-32 h-1 bg-foreground/30 rounded-full" />
    </motion.div>
  );
}

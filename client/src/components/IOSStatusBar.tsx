import { motion } from "framer-motion";
import statusBarImage from "@assets/dynamic_island_1766091053259.png";

export function IOSStatusBar() {
  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-[100] h-12 flex items-center justify-center bg-background/95 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <img 
        src={statusBarImage}
        alt="Status Bar"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

export function IOSHomeIndicator() {
  return (
    <motion.div 
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="w-32 h-1 bg-foreground/30 rounded-full" />
    </motion.div>
  );
}

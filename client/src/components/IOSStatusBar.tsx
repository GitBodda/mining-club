import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import statusBarImage from "@assets/dynamic_island_1766091053259.png";

export function IOSStatusBar() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
    >
      <div 
        className={`h-12 flex items-center justify-center transition-all duration-300 ${
          hasScrolled ? "bg-background/70 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <img 
          src={statusBarImage}
          alt="Status Bar"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div
        className={`h-16 transition-all duration-300 pointer-events-auto ${
          hasScrolled ? "bg-transparent" : "bg-transparent"
        }`}
        style={{
          background: hasScrolled 
            ? "linear-gradient(to bottom, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.3) 50%, hsl(var(--background) / 0.05) 100%)"
            : "linear-gradient(to bottom, hsl(var(--background) / 0.05) 0%, hsl(var(--background) / 0.02) 100%)"
        }}
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

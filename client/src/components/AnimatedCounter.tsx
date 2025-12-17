import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  decimals = 2,
  duration = 0.8,
  className = "",
  prefix = "",
  suffix = ""
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000
  });

  const displayValue = useTransform(springValue, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  const [displayText, setDisplayText] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (v) => {
      setDisplayText(v);
    });
    return () => unsubscribe();
  }, [displayValue]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {displayText}
    </motion.span>
  );
}

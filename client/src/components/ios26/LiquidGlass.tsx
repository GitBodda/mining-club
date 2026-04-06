/**
 * iOS 26 Liquid Glass Effect — Stock Component
 * 
 * Uses backdrop-filter: blur() with semi-transparent backgrounds
 * to achieve the frosted glass look that works across all browsers.
 * 
 * Light: white at 72% + 24px blur + subtle border
 * Dark:  dark at 60% + 24px blur + light border
 * Shadow: 0 8px 40px rgba(0,0,0,0.12)
 */

import React from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  /** Border radius in px. Defaults to 296 (pill) per Figma. */
  radius?: number;
  /** Apply the glass shadow. Defaults to true. */
  shadow?: boolean;
  /** Additional style overrides */
  style?: React.CSSProperties;
  as?: React.ElementType;
}

export function LiquidGlass({
  children,
  className,
  radius = 296,
  shadow = true,
  style,
  as: Component = "div",
}: LiquidGlassProps) {
  const r = `${radius}px`;

  return (
    <Component
      className={cn("relative", className)}
      style={{
        borderRadius: r,
        ...style,
      }}
    >
      {/* Multi-layer iOS 26 dock material */}
      {/* Layer 1: Backdrop blur */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          borderRadius: r,
          backdropFilter: "blur(30px) saturate(1.8)",
          WebkitBackdropFilter: "blur(30px) saturate(1.8)",
        }}
      />
      {/* Layer 2: Hard-light shadow blur */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          borderRadius: r,
          background: "rgba(0, 0, 0, 0.4)",
          backgroundBlendMode: "hard-light",
          filter: "blur(30px)",
          opacity: 0.15,
        }}
      />
      {/* Layer 3: Glass tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        aria-hidden="true"
        style={{
          borderRadius: r,
          background: "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(240,240,240,0.68) 100%)",
          backgroundBlendMode: "screen",
          border: "0.5px solid rgba(255,255,255,0.5)",
          boxShadow: shadow ? "0px 8px 40px 0px rgba(0, 0, 0, 0.12)" : undefined,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        aria-hidden="true"
        style={{
          borderRadius: r,
          background: "rgba(0, 0, 0, 0.2)",
          backgroundBlendMode: "screen",
          border: "0.5px solid rgba(255,255,255,0.12)",
          boxShadow: shadow ? "0px 8px 40px 0px rgba(0, 0, 0, 0.25)" : undefined,
        }}
      />

      {/* Content */}
      <div className="relative z-[1] flex-1 flex items-center w-full h-full">{children}</div>
    </Component>
  );
}

/**
 * Shorthand for a full-width glass card (radius 20px).
 */
export function GlassCard({
  children,
  className,
  ...props
}: Omit<LiquidGlassProps, "radius">) {
  return (
    <LiquidGlass radius={20} className={cn("w-full", className)} {...props}>
      {children}
    </LiquidGlass>
  );
}

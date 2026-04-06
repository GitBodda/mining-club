/**
 * iOS 26 Stock Components — Barrel Export
 * All components extracted from Apple's official iOS 26 Figma Design Kit.
 */

// Design tokens
export { typography, colors, shadows, radii, scrollEdge, layout, motion as motionTokens } from "@/lib/ios26-tokens";

// Core glass effect
export { LiquidGlass, GlassCard } from "./LiquidGlass";

// Scroll edge blur (top + bottom feathered blur)
export { ScrollEdgeBlur } from "./ScrollEdgeBlur";

// Navigation bar (top toolbar)
export { iOS26Toolbar } from "./iOS26Toolbar";

// Tab bar (bottom floating dock)
export { iOS26TabBar } from "./iOS26TabBar";
export type { TabItem } from "./iOS26TabBar";

// Sheets / Modals
export { iOS26Sheet, SheetCloseButton, SheetSubmitButton } from "./iOS26Sheet";

// Face ID overlay
export { iOS26FaceId } from "./iOS26FaceId";

// Hook
export { useScrollEdgeEffect } from "@/hooks/useScrollEdgeEffect";

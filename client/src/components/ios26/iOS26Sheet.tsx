/**
 * iOS 26 Sheet (Modal) — Stock Component
 * Extracted from Apple's iOS 26 Figma Design Kit node 770:21908
 *
 * Three official variants:
 *   - "fullscreen"      — sheet fills screen from 62px below top, with glass background
 *   - "fullscreenStack" — stacked sheets (background page visible behind)
 *   - "inspector"       — bottom inspector panel with glass background
 *
 * Key measurements:
 *   - Grabber: 36×5px, #ccc, rounded-full
 *   - Fullscreen shadow: 0 15px 75px rgba(0,0,0,0.18)
 *   - Inspector glass: #262626 color-dodge + rgba(245,245,245,0.6)
 *   - Inspector radii: top 34px, bottom 58px
 *   - Sheet sheet: rounded-t-[38px]
 *
 * This uses Framer Motion for iOS-native drag-to-dismiss and spring animations.
 */

import React, { useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiquidGlass } from "./LiquidGlass";

// ─── Types ──────────────────────────────────────────────────────────────────

type SheetVariant = "fullscreen" | "fullscreenStack" | "inspector";

interface iOS26SheetProps {
  open: boolean;
  onClose: () => void;
  variant?: SheetVariant;
  title?: string;
  /** Left button (typically X). */
  leadingAction?: React.ReactNode;
  /** Right button (typically submit). */
  trailingAction?: React.ReactNode;
  children: React.ReactNode;
  /** Enable swipe-down to dismiss. Default true. */
  swipeToDismiss?: boolean;
  className?: string;
}

// ─── Grabber ────────────────────────────────────────────────────────────────

function Grabber() {
  return (
    <div className="flex justify-center pt-[5px] h-4">
      <div
        className="rounded-full dark:bg-[#3a3a3a]"
        style={{
          width: 36,
          height: 5,
          backgroundColor: "var(--ios26-fill-vibrant, #cccccc)",
          borderRadius: 100,
        }}
      />
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function iOS26Sheet({
  open,
  onClose,
  variant = "fullscreen",
  title,
  leadingAction,
  trailingAction,
  children,
  swipeToDismiss = true,
  className,
}: iOS26SheetProps) {
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (swipeToDismiss && info.offset.y > 100 && info.velocity.y > 200) {
        onClose();
      }
    },
    [swipeToDismiss, onClose]
  );

  const isInspector = variant === "inspector";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              "fixed z-[101] left-0 right-0 overflow-hidden",
              isInspector
                ? "bottom-0 mx-1.5 mb-1.5"
                : "top-[62px] bottom-0",
              className
            )}
            style={{
              borderTopLeftRadius: isInspector ? 34 : 38,
              borderTopRightRadius: isInspector ? 34 : 38,
              borderBottomLeftRadius: isInspector ? 58 : 0,
              borderBottomRightRadius: isInspector ? 58 : 0,
            }}
            initial={{ y: isInspector ? "100%" : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            drag={swipeToDismiss ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {/* Glass background for inspector variant */}
            {isInspector ? (
              <InspectorGlassBackground />
            ) : (
              <div className="absolute inset-0 bg-white dark:bg-[#1c1c1e]" style={{
                borderTopLeftRadius: 38,
                borderTopRightRadius: 38,
                boxShadow: "0px 15px 75px 0px rgba(0, 0, 0, 0.18)",
              }} />
            )}

            {/* Content */}
            <div className="relative z-[1] flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex flex-col items-center pb-2.5">
                <Grabber />
                <div className="flex items-center justify-between w-full px-4">
                  {/* Leading */}
                  <div className="flex items-center h-[44px]">
                    {leadingAction || <div className="w-9" />}
                  </div>

                  {/* Center title */}
                  {title && (
                    <p
                      className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold leading-[22px] tracking-[-0.43px] text-foreground dark:text-white truncate max-w-[200px]"
                      style={{ fontWeight: 590 }}
                    >
                      {title}
                    </p>
                  )}

                  {/* Trailing */}
                  <div className="flex items-center h-[44px]">
                    {trailingAction || <div className="w-9" />}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Inspector Glass Background ─────────────────────────────────────────────

function InspectorGlassBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true"
      style={{
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
        borderBottomLeftRadius: 58,
        borderBottomRightRadius: 58,
      }}
    >
      {/* Shadow */}
      <div
        className="absolute inset-0"
        style={{
          borderTopLeftRadius: 34,
          borderTopRightRadius: 34,
          borderBottomLeftRadius: 58,
          borderBottomRightRadius: 58,
          boxShadow: "0px 8px 40px 0px rgba(0, 0, 0, 0.12)",
        }}
      />

      {/* Light mode layers */}
      <div className="absolute inset-0 dark:hidden" style={{
        borderRadius: "inherit",
        backgroundColor: "rgba(245, 245, 245, 0.6)",
      }} />
      <div className="absolute inset-0 dark:hidden" style={{
        borderRadius: "inherit",
        backgroundColor: "#262626",
        mixBlendMode: "color-dodge",
      }} />

      {/* Dark mode layers */}
      <div className="absolute inset-0 hidden dark:block" style={{
        borderRadius: "inherit",
        backgroundColor: "rgba(30, 30, 30, 0.85)",
      }} />
    </div>
  );
}

// ─── Sheet Action Buttons ───────────────────────────────────────────────────

/** Standard close (X) button for sheets, with glass background */
export function SheetCloseButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-foreground/60 dark:text-white/60 active:scale-95 transition-transform"
      aria-label="Close"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M3.5 3.5L11.5 11.5M11.5 3.5L3.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Standard submit button (blue circle with arrow) */
export function SheetSubmitButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95",
        disabled
          ? "bg-[#0088ff]/30 text-white/50"
          : "bg-[#0088ff] text-white shadow-md shadow-blue-500/25"
      )}
      aria-label="Submit"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3L8 13M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

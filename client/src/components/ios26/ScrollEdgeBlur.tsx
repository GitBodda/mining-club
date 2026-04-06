/**
 * iOS 26 Scroll Edge Effect — Stock Component
 * Extracted from Apple's iOS 26 Figma Design Kit
 *
 * TOP edge:  167px height, backdrop-blur 30px, mask-alpha gradient, opacity 0.9
 * BOTTOM edge: 110px height, same treatment, inverted gradient
 *
 * Uses mix-blend-mode: screen (light bg → black base blends to transparent)
 * The mask-image creates a fade-in/fade-out gradient so the blur feathers naturally.
 */

import React from "react";
import { motion } from "framer-motion";
import { useScrollEdgeEffect } from "@/hooks/useScrollEdgeEffect";

interface ScrollEdgeBlurProps {
  /** Show top edge effect. Default true. */
  top?: boolean;
  /** Show bottom edge effect. Default true. */
  bottom?: boolean;
  /** Scroll threshold for full intensity (px). Default 60. */
  threshold?: number;
  /** Ref to a scrollable container (defaults to window). */
  scrollRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Drop this component inside a page layout to get iOS 26's native
 * scroll-edge blur effect — the header and footer areas that blur
 * content as it scrolls behind them.
 */
export function ScrollEdgeBlur({
  top = true,
  bottom = true,
  threshold = 60,
  scrollRef,
}: ScrollEdgeBlurProps) {
  const { progress } = useScrollEdgeEffect({ threshold, element: scrollRef });

  return (
    <>
      {/* ── Top Scroll Edge ── */}
      {top && (
        <div
          className="fixed top-0 left-0 right-0 z-[80] pointer-events-none"
          style={{ height: 90 }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: progress * 0.9 }}
            transition={{ duration: 0.1 }}
            style={{
              backdropFilter: `blur(${progress * 30}px)`,
              WebkitBackdropFilter: `blur(${progress * 30}px)`,
              maskImage:
                "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
            }}
          >
            {/* Light mode: white base with screen blend */}
            <div
              className="absolute inset-0 dark:hidden"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                mixBlendMode: "normal",
              }}
            />
            {/* Dark mode: black base with screen blend */}
            <div
              className="absolute inset-0 hidden dark:block"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.92)",
                mixBlendMode: "normal",
              }}
            />
          </motion.div>
        </div>
      )}

      {/* ── Bottom Scroll Edge ── */}
      {bottom && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[80] pointer-events-none"
          style={{ height: 110 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              opacity: 0.9,
              maskImage:
                "linear-gradient(to top, black 0%, black 30%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, black 30%, transparent 100%)",
            }}
          >
            <div
              className="absolute inset-0 dark:hidden"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                mixBlendMode: "normal",
              }}
            />
            <div
              className="absolute inset-0 hidden dark:block"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.92)",
                mixBlendMode: "normal",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

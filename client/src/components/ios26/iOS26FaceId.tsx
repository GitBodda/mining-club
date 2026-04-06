/**
 * iOS 26 Face ID Overlay — Stock Component
 * Extracted from Apple's iOS 26 Figma Design Kit node 770:21898
 *
 * Two states:
 *   - "authenticating" — Face ID scan icon (green lines on black bezel)
 *   - "success"        — Green checkmark circle on black bezel
 *
 * Key measurements:
 *   - Bezel: 151×151px, rounded-[40px], black bg
 *   - Shadow: 0 12px 74px rgba(0,0,0,0.22)
 *   - Face icon / checkmark: 70×70px centered in bezel
 *   - Success color: #87fa89
 *   - Backdrop blur: 1px over entire screen
 *
 * Uses Framer Motion for the scan → success animation sequence.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type FaceIdState = "authenticating" | "success" | "hidden";

interface iOS26FaceIdProps {
  /** Control the overlay state externally. */
  state: FaceIdState;
  /** Called when the success animation completes. */
  onComplete?: () => void;
  /** Auto-transition from authenticating → success after this delay (ms). Default 1500. */
  autoSuccessDelay?: number;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function iOS26FaceId({
  state: externalState,
  onComplete,
  autoSuccessDelay = 1500,
  className,
}: iOS26FaceIdProps) {
  const [internalState, setInternalState] = useState<FaceIdState>(externalState);

  useEffect(() => {
    setInternalState(externalState);
  }, [externalState]);

  // Auto-transition to success
  useEffect(() => {
    if (internalState === "authenticating" && autoSuccessDelay > 0) {
      const timer = setTimeout(() => {
        setInternalState("success");
      }, autoSuccessDelay);
      return () => clearTimeout(timer);
    }
  }, [internalState, autoSuccessDelay]);

  // Dismiss after success
  useEffect(() => {
    if (internalState === "success") {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [internalState, onComplete]);

  const isVisible = internalState !== "hidden";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed inset-0 z-[200] flex items-start justify-center",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            backdropFilter: "blur(1px)",
            WebkitBackdropFilter: "blur(1px)",
          }}
        >
          {/* Bezel */}
          <motion.div
            className="mt-[10px] flex items-center justify-center"
            style={{
              width: 151,
              height: 151,
              borderRadius: 40,
              backgroundColor: "#000000",
              boxShadow: "0px 12px 74px 0px rgba(0, 0, 0, 0.22)",
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <AnimatePresence mode="wait">
              {internalState === "authenticating" && (
                <motion.div
                  key="scan"
                  className="flex items-center justify-center"
                  style={{ width: 70, height: 70 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaceIdScanIcon />
                </motion.div>
              )}

              {internalState === "success" && (
                <motion.div
                  key="success"
                  className="flex items-center justify-center"
                  style={{ width: 70, height: 70 }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <SuccessCheckmark />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Face ID Scan Icon (Green lines forming face outline) ───────────────────

function FaceIdScanIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      {/* Top-left corner */}
      <path d="M5 18V10C5 7.23858 7.23858 5 10 5H18" stroke="#87fa89" strokeWidth="3" strokeLinecap="round" />
      {/* Top-right corner */}
      <path d="M42 5H50C52.7614 5 55 7.23858 55 10V18" stroke="#87fa89" strokeWidth="3" strokeLinecap="round" />
      {/* Bottom-left corner */}
      <path d="M5 42V50C5 52.7614 7.23858 55 10 55H18" stroke="#87fa89" strokeWidth="3" strokeLinecap="round" />
      {/* Bottom-right corner */}
      <path d="M42 55H50C52.7614 55 55 52.7614 55 50V42" stroke="#87fa89" strokeWidth="3" strokeLinecap="round" />
      {/* Left eye */}
      <path d="M20 20V26" stroke="#87fa89" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right eye */}
      <path d="M40 20V26" stroke="#87fa89" strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose */}
      <path d="M30 25V33H34" stroke="#87fa89" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mouth */}
      <path d="M22 39C24.5 43 35.5 43 38 39" stroke="#87fa89" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Success Checkmark (Green circle + check) ──────────────────────────────

function SuccessCheckmark() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
      {/* Circle */}
      <motion.circle
        cx="30"
        cy="30"
        r="26"
        stroke="#87fa89"
        strokeWidth="3"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      {/* Checkmark */}
      <motion.path
        d="M18 30L26 38L42 22"
        stroke="#87fa89"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
}

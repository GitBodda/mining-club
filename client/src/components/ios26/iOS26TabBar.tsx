/**
 * iOS 26 Tab Bar — Stock Component
 * Extracted from Apple's iOS 26 Figma Design Kit node 5660:57680
 *
 * Features:
 *   - Floating glass pill dock (radius 296px)
 *   - 3-layer glass effect (white 65% → #ddd color-burn → #f7f7f7 darken)
 *   - Active tab: blue accent #0088ff with #ededed selection bg
 *   - Inactive tabs: #1a1a1a (light) / #f5f5f5 (dark)
 *   - Shadow: 0 8px 40px rgba(0,0,0,0.12)
 *   - Optional split search button (separate glass pill)
 *   - Safe area bottom padding: 25px + env(safe-area-inset-bottom)
 *
 * This is the EXACT layout from the Figma source.
 */

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiquidGlass } from "./LiquidGlass";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  icon: React.ReactNode;
  /** Optional active state icon (e.g. filled version) */
  activeIcon?: React.ReactNode;
  label: string;
}

interface iOS26TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Show a separate search pill to the right. */
  searchButton?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function iOS26TabBar({
  tabs,
  activeTab,
  onTabChange,
  searchButton,
  className,
}: iOS26TabBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[90] flex justify-center pointer-events-none",
        className
      )}
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        paddingLeft: 25,
        paddingRight: 25,
        paddingTop: 16,
      }}
    >
      <motion.div
        className="pointer-events-auto flex items-center gap-4 w-full max-w-md"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* ── Main Tab Pill ── */}
        <LiquidGlass
          radius={296}
          className="flex-1 flex items-center pl-0.5 pr-2.5 min-h-[66px]"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center",
                  "pt-2 pb-[9px] px-2.5 -mr-2 last:mr-0",
                  "active:scale-95 transition-transform"
                )}
                whileTap={{ scale: 0.92 }}
              >
                {/* Selection highlight — square liquid glass effect */}
                {isActive && (
                  <motion.div
                    layoutId="ios26-tab-selection"
                    className="absolute inset-y-0 rounded-[18px] overflow-hidden"
                    style={{ left: '50%', width: '62px', marginLeft: '-31px' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {/* Glass blur layer */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        backgroundBlendMode: 'screen',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                      }}
                    />
                    {/* Dark mode glass tint */}
                    <div
                      className="absolute inset-0 hidden dark:block"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '0.5px solid rgba(255,255,255,0.12)',
                        borderRadius: '18px',
                      }}
                    />
                    {/* Light mode */}
                    <div
                      className="absolute inset-0 dark:hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: '0.5px solid rgba(255,255,255,0.3)',
                        borderRadius: '18px',
                      }}
                    />
                  </motion.div>
                )}

                {/* Icon — larger when inactive, smaller when active to fit with label */}
                <motion.div
                  className={cn(
                    "relative z-[1] flex items-center justify-center font-semibold",
                    isActive
                      ? "text-[var(--ios26-accent-blue,#0088ff)]"
                      : "text-[var(--ios26-label-vibrant,#1a1a1a)] dark:text-[var(--ios26-label-vibrant-dark,#f5f5f5)]"
                  )}
                  animate={{ scale: isActive ? 0.9 : 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  style={{ fontWeight: 590 }}
                >
                  {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                </motion.div>

                {/* Label — only shown for active tab */}
                {isActive && (
                <span
                  className={cn(
                    "relative z-[1] text-[11px] leading-[13px] tracking-[-0.1px] font-semibold mt-0.5",
                    "text-[var(--ios26-accent-blue,#0088ff)]"
                  )}
                  style={{ fontWeight: 590 }}
                >
                  {tab.label}
                </span>
                )}
              </motion.button>
            );
          })}
        </LiquidGlass>

        {/* ── Optional Search Pill ── */}
        {searchButton && (
          <LiquidGlass radius={296} className="shrink-0 flex items-center pr-2.5">
            <motion.button
              onClick={searchButton.onPress}
              className="flex items-center justify-center w-[66px] h-[66px] pt-2 pb-[9px] px-2 text-[18px] leading-[30px] text-foreground/80 dark:text-white/80 active:scale-95 transition-transform"
              whileTap={{ scale: 0.92 }}
              style={{ fontWeight: 590 }}
            >
              {searchButton.icon}
            </motion.button>
          </LiquidGlass>
        )}
      </motion.div>
    </div>
  );
}

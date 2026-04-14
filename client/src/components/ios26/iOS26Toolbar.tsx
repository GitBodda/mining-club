/**
 * iOS 26 Toolbar (Top Navigation Bar) — Stock Component
 * Extracted from Apple's iOS 26 Figma Design Kit node 5661:41970
 *
 * Supports 5 official variants:
 *   - "default"           — compact center title
 *   - "largeTitle"        — large title left-aligned
 *   - "compactLargeTitle" — compact large title (scrolled state)
 *   - "title2Line"        — title + subtitle centered
 *   - "title2LineLeft"    — title + subtitle left-aligned
 *
 * Integrates with useScrollEdgeEffect to animate between large ↔ compact.
 * Uses the stock Liquid Glass pill buttons from the Figma extraction.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiquidGlass } from "./LiquidGlass";
import { useScrollEdgeEffect } from "@/hooks/useScrollEdgeEffect";
import { ChevronLeft, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";

// ─── Types ──────────────────────────────────────────────────────────────────

type ToolbarVariant =
  | "default"
  | "largeTitle"
  | "compactLargeTitle"
  | "title2Line"
  | "title2LineLeft";

interface ToolbarAction {
  icon: React.ReactNode;
  onPress: () => void;
  label: string;
}

interface iOS26ToolbarProps {
  title: string;
  subtitle?: string;
  variant?: ToolbarVariant;
  /** Show the back button on the left. */
  showBack?: boolean;
  /** Custom back handler. Defaults to history.back(). */
  onBack?: () => void;
  /** Right side actions (grouped into a glass pill). */
  trailingActions?: ToolbarAction[];
  /** Show built-in theme toggle + notifications + settings. */
  showDefaultActions?: boolean;
  onOpenSettings?: () => void;
  /** Auto-collapse large title on scroll. Default true. */
  scrollCollapse?: boolean;
  /** Scroll threshold before collapsing (px). Default 60. */
  scrollThreshold?: number;
  /** Position: 'sticky' (default) or 'fixed'. Fixed places toolbar above scroll edge blur. */
  position?: 'sticky' | 'fixed';
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function iOS26Toolbar({
  title,
  subtitle,
  variant = "largeTitle",
  showBack = false,
  onBack,
  trailingActions = [],
  showDefaultActions = false,
  onOpenSettings,
  scrollCollapse = true,
  scrollThreshold = 60,
  position = 'sticky',
  className,
}: iOS26ToolbarProps) {
  const { progress, isScrolled } = useScrollEdgeEffect({
    threshold: scrollThreshold,
  });
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // For large title variants: animate between large and compact
  const isLargeVariant = variant === "largeTitle" || variant === "compactLargeTitle";
  const showLargeTitle = isLargeVariant && (!scrollCollapse || progress < 0.5);
  const showCompactTitle =
    !isLargeVariant || (scrollCollapse && progress >= 0.5);

  const isLeftAligned = variant === "title2LineLeft";

  // Build trailing actions array
  const allTrailingActions: ToolbarAction[] = showDefaultActions
    ? [
        {
          icon: theme === "dark"
            ? <i className="fi fi-tr-moon-stars" style={{ fontSize: 18, lineHeight: 1 }} />
            : <i className="fi fi-tr-sun" style={{ fontSize: 18, lineHeight: 1, color: '#f59e0b' }} />,
          onPress: toggleTheme,
          label: "Toggle theme",
        },
        {
          icon: <i className="fi fi-tr-bell" style={{ fontSize: 18, lineHeight: 1 }} />,
          onPress: () => setShowNotifications(true),
          label: "Notifications",
        },
        {
          icon: <i className="fi fi-tr-blockchain-3" style={{ fontSize: 18, lineHeight: 1 }} />,
          onPress: () => onOpenSettings?.(),
          label: "Settings",
        },
        ...trailingActions,
      ]
    : trailingActions;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <>
      {/* ── Controls Row — fixed above blur ── */}
      <div
        data-toolbar-controls
        className="fixed top-0 left-0 right-0 z-[90]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 min-h-[44px] max-w-md mx-auto">
          {/* Leading — back circle */}
          <div className="flex items-center gap-2">
            {showBack ? (
              <LiquidGlass radius={999} className="w-[38px] h-[38px] flex items-center justify-center">
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-full h-full rounded-full text-foreground/80 dark:text-white/80 active:scale-95 transition-transform"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-[20px] h-[20px]" />
                </button>
              </LiquidGlass>
            ) : (
              <div className="w-2" />
            )}
          </div>

          {/* Trailing actions — grouped in a glass pill */}
          <div className="flex items-center gap-2">
            {allTrailingActions.length > 0 && (
              <LiquidGlass radius={296} className="flex items-center h-[38px] px-1 gap-[19px]">
                {allTrailingActions.map((action, i) => (
                  <div key={i} className="relative">
                    <button
                      onClick={action.onPress}
                      className="flex items-center justify-center w-8 h-8 rounded-full text-foreground/80 dark:text-white/80 active:scale-95 transition-transform"
                      aria-label={action.label}
                    >
                      {action.icon}
                    </button>
                    {/* Notification badge */}
                    {action.label === "Notifications" && unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
                    )}
                  </div>
                ))}
              </LiquidGlass>
            )}
          </div>
        </div>
      </div>

      {/* ── Spacer + Large Title (in document flow) ── */}
      <div className={cn("w-full", className)} style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 44px)" }}>
        {/* ── Large Title (below controls) ── */}
        {isLargeVariant && (
          <motion.div
            className="px-4 pb-2"
            animate={{
              height: showLargeTitle ? "auto" : 0,
              opacity: showLargeTitle ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <h1
              className="text-[34px] font-bold leading-[41px] tracking-[0.4px] text-foreground dark:text-white"
              style={{ fontWeight: 700 }}
            >
              {title}
            </h1>
          </motion.div>
        )}

        {/* Left-aligned title + subtitle for 2-line-left variant */}
        {isLeftAligned && (
          <div className="px-4 pb-2">
            <p
              className="text-[17px] font-semibold leading-[22px] tracking-[-0.43px] text-foreground dark:text-white"
              style={{ fontWeight: 590 }}
            >
              {title}
            </p>
          </div>
        )}
      </div>

      {/* ── Notification Shade ── */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-1/2 w-[min(92vw,28rem)] max-w-md bg-background border border-border rounded-2xl shadow-2xl z-[105] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              {notifications.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.isRead && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />}
                        <div className={!notif.isRead ? '' : 'pl-5'}>
                          <p className="font-medium text-foreground text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-2">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <i className="fi fi-tr-bell" style={{ fontSize: 40, lineHeight: 1 }} />
                  <p className="text-sm font-medium text-foreground mt-3">No Notifications Yet</p>
                  <p className="text-xs text-muted-foreground mt-1">You'll see updates here</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

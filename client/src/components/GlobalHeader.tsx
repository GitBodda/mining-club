import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Bell, Sun, Moon, X, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { ScrollAwareStatusBar } from "./ScrollAwareStatusBar";

interface GlobalHeaderProps {
  activeTab?: string;
  onOpenSettings?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToInvest?: () => void;
}

export function GlobalHeader({
  activeTab = "home",
  onOpenSettings,
  onNavigateToHome,
  onNavigateToWallet,
  onNavigateToInvest,
}: GlobalHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Only render on home page - subpages have their own inline headers
  if (activeTab !== "home") {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigateToHome?.();
    }
  };

  return (
    <>
      {/* Scroll-aware status bar gradient */}
      <ScrollAwareStatusBar />
      
      {/* Header with integrated safe area - no extra spacer needed */}
      <header
        className="sticky top-0 z-40 bg-transparent"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-4 px-4 h-14">
          {/* Left Side - Back Button & Settings */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleBack}
              className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-transform"
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              onClick={onOpenSettings}
              className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-transform"
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              <SettingsIcon className="w-[17px] h-[17px] text-muted-foreground" />
            </motion.button>
            <Link href="/growth">
              <motion.button
                className="h-10 px-3 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all"
                whileTap={{ scale: 0.96 }}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Growth Hub</span>
                </div>
              </motion.button>
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 ml-auto">
            <motion.button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-transform"
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              {theme === "dark" ? (
                <Moon className="w-[17px] h-[17px] text-muted-foreground" />
              ) : (
                <Sun className="w-[17px] h-[17px] text-amber-500" />
              )}
            </motion.button>
            <div className="relative">
              <motion.button
                className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center hover-elevate"
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-[17px] h-[17px] text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
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
                      className={`p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.read && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />}
                        <div className={!notif.read ? '' : 'pl-5'}>
                          <p className="font-medium text-foreground text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-2">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">No Notifications Yet</p>
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

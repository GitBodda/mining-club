import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Bell, Sun, Moon, X, Home, Wallet, PieChart, HelpCircle, LogOut, Settings as SettingsIcon, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { logOut } from "@/lib/firebase";

interface GlobalHeaderProps {
  onOpenSettings?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToInvest?: () => void;
}

export function GlobalHeader({
  onOpenSettings,
  onNavigateToHome,
  onNavigateToWallet,
  onNavigateToInvest,
}: GlobalHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logOut();
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      <header
        className="bg-transparent pt-[17.5px]"
      >
        <div className="flex items-center gap-4 px-4 h-16">
          {/* Left Side - Hamburger Menu & Settings */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-transform"
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              <Menu className="w-[17px] h-[17px] text-muted-foreground" />
            </motion.button>
            <motion.button
              onClick={onOpenSettings}
              className="w-10 h-10 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-transform"
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              <SettingsIcon className="w-[17px] h-[17px] text-muted-foreground" />
            </motion.button>
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src="/attached_assets/blockmint-logo.svg"
              alt="BlockMint"
              className="h-[47.5px] w-auto object-contain drop-shadow-lg"
              style={{ background: 'transparent' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
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

      {/* Hamburger Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-[101] liquid-glass bg-background/95 backdrop-blur-xl border-r border-white/10 shadow-2xl"
            >
              <div className="flex flex-col h-full p-6 pt-safe">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">BlockMint</h2>
                    <p className="text-sm text-muted-foreground">Mining Dashboard</p>
                  </div>
                  <motion.button
                    onClick={() => setShowMenu(false)}
                    className="w-9 h-9 rounded-lg liquid-glass flex items-center justify-center hover-elevate"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </div>

                <nav className="flex-1 space-y-2">
                  <motion.button
                    onClick={() => { onNavigateToHome?.(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Home className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-foreground">Home</span>
                  </motion.button>
                  <motion.button
                    onClick={() => { onNavigateToWallet?.(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Wallet className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-foreground">Wallet</span>
                  </motion.button>
                  <motion.button
                    onClick={() => { onNavigateToInvest?.(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PieChart className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-foreground">Invest</span>
                  </motion.button>
                  
                  <motion.button
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <HelpCircle className="w-5 h-5 text-cyan-500" />
                    <span className="text-sm font-medium text-foreground">Support</span>
                  </motion.button>

                  <div className="pt-4 border-t border-white/10">
                    <motion.button
                      onClick={() => { onOpenSettings?.(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <SettingsIcon className="w-5 h-5 text-slate-500" />
                      <span className="text-sm font-medium text-foreground">Settings</span>
                    </motion.button>
                  </div>
                </nav>

                <div className="pt-4 border-t border-white/10">
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-500"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100%-2rem)] max-w-md bg-background border border-border rounded-2xl shadow-2xl z-[101] overflow-hidden"
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

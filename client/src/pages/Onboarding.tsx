import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Gem, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

import btcMine from "@assets/Bitcoin_Mine_1766014388617.webp";
import mixedMain from "@assets/Mixed_main_1766014388605.webp";
import serverMining from "@assets/Server_Mining_1766014388610.webp";

interface OnboardingProps {
  onComplete: () => void;
  onSignIn: () => void;
  onSkip?: () => void;
}

const onboardingPages = [
  {
    id: 1,
    title: "Welcome to BlockMint",
    subtitle: "The Future of Bitcoin Mining",
    description: "Purchase hashpower contracts and earn Bitcoin passively. No hardware required, no electricity bills.",
    image: mixedMain,
    icon: Zap,
    gradient: "from-blue-500 via-cyan-400 to-blue-600"
  },
  {
    id: 2,
    title: "Secure & Transparent",
    subtitle: "Bank-Grade Security",
    description: "Your investments are protected with enterprise-grade security. Track every transaction on the blockchain.",
    image: serverMining,
    icon: Shield,
    gradient: "from-emerald-500 via-teal-400 to-emerald-600"
  },
  {
    id: 3,
    title: "Solo Mining Jackpot",
    subtitle: "Win Full Block Rewards",
    description: "Join our solo mining pools for a chance to win the entire 3 BTC block reward. High risk, massive rewards.",
    image: btcMine,
    icon: Gem,
    gradient: "from-amber-500 via-orange-400 to-amber-600"
  }
];

export function Onboarding({ onComplete, onSignIn, onSkip }: OnboardingProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const page = onboardingPages[currentPage];
  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-4 pb-8">
        <div className="flex items-center justify-center mb-2 relative">
          <motion.div 
            className="h-52 flex items-center justify-center relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10 dark:from-primary/15 dark:via-transparent dark:to-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/3 bg-white/70 dark:bg-transparent rounded-full blur-xl"></div>
            <img
              src="/attached_assets/BlockMint-Logo.svg"
              alt="BlockMint"
              className="h-48 w-auto object-contain relative z-10"
              style={{
                filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 25px rgba(16, 185, 129, 0.4)) contrast(1.15) saturate(1.25)',
                imageRendering: '-webkit-optimize-contrast',
              }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </motion.div>
          <div className="absolute right-0 flex flex-col items-end gap-2">
            <motion.button
              onClick={() => onSkip ? onSkip() : onSignIn()}
              className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center hover-elevate transition-colors text-2xl font-light text-muted-foreground hover:text-foreground"
              whileTap={{ scale: 0.95 }}
              data-testid="button-skip"
              type="button"
              aria-label="Skip onboarding"
            >
              ×
            </motion.button>
            <ThemeToggle />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;

              if (swipe < -10000) {
                // Swiped left (next page)
                handleNext();
              } else if (swipe > 10000) {
                // Swiped right (previous page)
                handlePrevious();
              }
            }}
            key={currentPage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 flex flex-col cursor-grab active:cursor-grabbing"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div 
                className="relative w-48 h-48 sm:w-52 sm:h-52 mb-8"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${page.gradient} opacity-20 rounded-full blur-3xl`} />
                <img 
                  src={page.image} 
                  alt={page.title}
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                  data-testid={`img-onboarding-${currentPage}`}
                />
              </motion.div>

              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${page.gradient} text-white text-sm font-semibold`}
                >
                  <Icon className="w-4 h-4" />
                  {page.subtitle}
                </motion.div>
                
                <h1 
                  className="font-display text-3xl font-bold text-foreground"
                  data-testid={`heading-onboarding-${currentPage}`}
                >
                  {page.title}
                </h1>
                
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  {page.description}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2 my-8 mt-6">
              {onboardingPages.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentPage 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-muted-foreground/30'
                  }`}
                  animate={{ scale: index === currentPage ? 1.1 : 1 }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 opacity-60 blur-xl"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <Button
              onClick={handleNext}
              className="relative w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-white shadow-2xl shadow-emerald-500/50 border-2 border-white/20 hover:border-white/40 transition-all duration-300 overflow-hidden group"
              data-testid="button-next-onboarding"
            >
              {/* Shimmer effect */}
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-200%", "200%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1
                }}
              />
              {/* Hover gradient overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Button content */}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {currentPage === onboardingPages.length - 1 ? "Get Started" : "Continue"}
                </motion.span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.div>
              </span>
            </Button>
          </motion.div>

          {currentPage === onboardingPages.length - 1 && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-muted-foreground"
            >
              Already have an account?{" "}
              <button 
                onClick={onSignIn}
                className="text-primary font-semibold hover:underline"
                data-testid="button-signin-link"
              >
                Sign In
              </button>
            </motion.p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/privacy" 
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            data-testid="link-privacy-policy"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

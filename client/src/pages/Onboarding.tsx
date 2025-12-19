import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Gem, Shield, Zap, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";

import btcMine from "@assets/Bitcoin_Mine_1766014388617.png";
import mixedMain from "@assets/Mixed_main_1766014388605.png";
import serverMining from "@assets/Server_Mining_1766014388610.png";

interface OnboardingProps {
  onComplete: () => void;
  onSignIn: () => void;
  onSkip?: () => void;
}

const onboardingPages = [
  {
    id: 1,
    title: "Welcome to Mining Club",
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

  const page = onboardingPages[currentPage];
  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-16 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">Mining Club</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (onSkip) {
                onSkip();
              } else {
                onSignIn();
              }
            }}
            className="text-muted-foreground"
            data-testid="button-skip"
          >
            Skip
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div 
                className="relative w-64 h-64 mb-8"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
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
                  transition={{ delay: 0.2 }}
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

            <div className="flex justify-center gap-2 mb-8">
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
          <Button
            onClick={handleNext}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white"
            data-testid="button-next-onboarding"
          >
            {currentPage === onboardingPages.length - 1 ? "Get Started" : "Continue"}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

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
      </div>
    </div>
  );
}

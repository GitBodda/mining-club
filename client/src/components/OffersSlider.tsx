import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Gift, Zap, Percent, Crown, Rocket, Star, Sparkles, Target, Award, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface Offer {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  backgroundType: number;
  ctaText: string | null;
  ctaLink: string | null;
  isActive: boolean;
  order: number;
}

// 10 modern gradient backgrounds that work with both dark and light themes
const backgrounds = [
  // 1. Electric Blue to Purple
  "bg-gradient-to-br from-blue-500/90 via-indigo-500/85 to-purple-600/90",
  // 2. Sunset Orange to Pink
  "bg-gradient-to-br from-orange-400/90 via-rose-500/85 to-pink-600/90",
  // 3. Ocean Teal to Blue
  "bg-gradient-to-br from-teal-400/90 via-cyan-500/85 to-blue-600/90",
  // 4. Forest Green to Emerald
  "bg-gradient-to-br from-green-500/90 via-emerald-500/85 to-teal-600/90",
  // 5. Royal Purple to Violet
  "bg-gradient-to-br from-purple-500/90 via-violet-500/85 to-indigo-600/90",
  // 6. Golden Amber
  "bg-gradient-to-br from-amber-400/90 via-yellow-500/85 to-orange-500/90",
  // 7. Cool Gray to Slate (Minimal)
  "bg-gradient-to-br from-slate-600/90 via-gray-500/85 to-zinc-700/90",
  // 8. Coral to Rose
  "bg-gradient-to-br from-red-400/90 via-rose-400/85 to-pink-500/90",
  // 9. Mint to Cyan
  "bg-gradient-to-br from-emerald-400/90 via-teal-400/85 to-cyan-500/90",
  // 10. Deep Space (Dark Gradient)
  "bg-gradient-to-br from-slate-800/95 via-purple-900/90 to-slate-900/95",
];

// Icons for each background type
const backgroundIcons = [
  Zap,        // Electric
  Gift,       // Sunset
  TrendingUp, // Ocean
  Sparkles,   // Forest
  Crown,      // Royal
  Star,       // Golden
  Target,     // Minimal
  Rocket,     // Coral
  Award,      // Mint
  Percent,    // Deep Space
];

export function OffersSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
    queryFn: async () => {
      const res = await fetch("/api/offers");
      if (!res.ok) throw new Error("Failed to fetch offers");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const goToNext = useCallback(() => {
    if (offers.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % offers.length);
    setProgress(0);
  }, [offers.length]);

  const goToPrev = useCallback(() => {
    if (offers.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
    setProgress(0);
  }, [offers.length]);

  // Auto-rotate every 30 seconds with progress bar
  useEffect(() => {
    if (!isAutoPlaying || offers.length <= 1) return;
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / 300); // 300 intervals for 30 seconds (100ms each)
      });
    }, 100);

    const slideInterval = setInterval(goToNext, 30000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isAutoPlaying, goToNext, offers.length]);

  // Pause auto-play on interaction
  const handleInteraction = () => {
    setIsAutoPlaying(false);
    // Resume after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (offers.length === 0) {
    // Show default promotional card when no offers
    return (
      <div className="relative overflow-hidden rounded-2xl h-28">
        <div className={`absolute inset-0 ${backgrounds[0]}`} />
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="relative h-full flex items-center justify-between px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white">Welcome to Mining Club</h3>
            </div>
            <p className="text-xs text-white/80 leading-tight">
              Start mining BTC & LTC today!
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  const currentOffer = offers[currentIndex];
  const bgIndex = (currentOffer?.backgroundType || 1) - 1;
  const BackgroundIcon = backgroundIcons[bgIndex] || Gift;

  return (
    <div 
      className="relative overflow-hidden rounded-2xl h-28"
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentOffer.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {/* Background */}
          {currentOffer.imageUrl ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentOffer.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ) : (
            <div className={`absolute inset-0 ${backgrounds[bgIndex]}`} />
          )}
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BackgroundIcon className="w-4 h-4 text-white shrink-0" />
                <h3 className="text-sm font-bold text-white truncate">{currentOffer.title}</h3>
              </div>
              {currentOffer.subtitle && (
                <p className="text-xs text-white/90 font-medium mb-0.5 truncate">{currentOffer.subtitle}</p>
              )}
              {currentOffer.description && (
                <p className="text-xs text-white/80 leading-tight line-clamp-2">{currentOffer.description}</p>
              )}
              {currentOffer.ctaText && currentOffer.ctaLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => window.open(currentOffer.ctaLink!, '_blank')}
                >
                  {currentOffer.ctaText}
                </Button>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
              <BackgroundIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {offers.length > 1 && (
        <>
          {/* Navigation Buttons */}
          <button
            onClick={() => { handleInteraction(); goToPrev(); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => { handleInteraction(); goToNext(); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          {/* Progress Bars - Story Style */}
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
            {offers.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm"
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: idx < currentIndex ? "100%" : "0%" }}
                  animate={{ 
                    width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
                  }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

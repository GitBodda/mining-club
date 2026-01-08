import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

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

// Gradient backgrounds for each offer type
const backgrounds = [
  "bg-gradient-to-br from-blue-500/90 via-indigo-500/85 to-purple-600/90",
  "bg-gradient-to-br from-orange-400/90 via-rose-500/85 to-pink-600/90",
  "bg-gradient-to-br from-teal-400/90 via-cyan-500/85 to-blue-600/90",
  "bg-gradient-to-br from-green-500/90 via-emerald-500/85 to-teal-600/90",
  "bg-gradient-to-br from-purple-500/90 via-violet-500/85 to-indigo-600/90",
  "bg-gradient-to-br from-amber-400/90 via-yellow-500/85 to-orange-500/90",
  "bg-gradient-to-br from-slate-600/90 via-gray-500/85 to-zinc-700/90",
  "bg-gradient-to-br from-red-400/90 via-rose-400/85 to-pink-500/90",
  "bg-gradient-to-br from-emerald-400/90 via-teal-400/85 to-cyan-500/90",
  "bg-gradient-to-br from-slate-800/95 via-purple-900/90 to-slate-900/95",
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Track Lottie play count per visit (session storage)
  const getLottiePlayCount = (lottieKey: string): number => {
    const key = `lottie_play_${lottieKey}`;
    return parseInt(sessionStorage.getItem(key) || '0', 10);
  };

  const incrementLottiePlayCount = (lottieKey: string) => {
    const key = `lottie_play_${lottieKey}`;
    const count = getLottiePlayCount(lottieKey);
    sessionStorage.setItem(key, String(count + 1));
  };

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

  // Auto-rotate with dynamic timing: 15 seconds for Virtual Card (first offer), 5 seconds for others
  useEffect(() => {
    if (!isAutoPlaying || offers.length <= 1) return;
    
    // First offer (Virtual Card) gets 15 seconds, others get 5 seconds
    const slideTime = currentIndex === 0 ? 15000 : 5000;
    const progressIntervals = currentIndex === 0 ? 150 : 50; // 150 intervals for 15s, 50 for 5s
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / progressIntervals); // Dynamic intervals based on slide
      });
    }, 100);

    const slideInterval = setInterval(goToNext, slideTime);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isAutoPlaying, goToNext, offers.length, currentIndex]);

  const handleInteraction = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (offers.length === 0) {
    return null;
  }

  const currentOffer = offers[currentIndex];
  const bgIndex = (currentOffer?.backgroundType || 1) - 1;
  const backgroundClass = backgrounds[bgIndex] || backgrounds[0];
  
  // Check if imageUrl is a Lottie file
  const isLottieUrl = currentOffer?.imageUrl?.includes('.lottie');
  
  // Check Lottie play count from session storage (max 2 times per visit)
  const lottieKey = currentOffer?.imageUrl || '';
  const playCount = getLottiePlayCount(lottieKey);
  const shouldPlayLottie = playCount < 2;

  return (
    <div 
      className="relative overflow-hidden rounded-2xl h-40"
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
          {/* Gradient Background */}
          <div className={`absolute inset-0 ${backgroundClass}`} />
          
          {/* Lottie Animation (Right side, responsive positioning) */}
          {isLottieUrl && currentOffer.imageUrl && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 w-32 h-32 sm:w-36 sm:h-36 pointer-events-none z-20">
              <DotLottieReact
                src={currentOffer.imageUrl}
                loop={shouldPlayLottie}
                autoplay={shouldPlayLottie}
                onLoad={() => {
                  if (shouldPlayLottie) {
                    incrementLottiePlayCount(lottieKey);
                  }
                }}
              />
            </div>
          )}
          
          {/* Content - Left side with safe spacing */}
          <div className="relative h-full flex flex-col justify-center pl-4 pr-12 py-3">
            <div className="space-y-1.5 max-w-full"
              style={{ maxWidth: isLottieUrl ? 'calc(100% - 10rem)' : 'calc(100% - 3rem)' }}
            >
              <div>
                <h3 className="text-base font-bold text-white drop-shadow-lg leading-tight line-clamp-2">
                  {currentOffer.title}
                  {currentOffer.ctaLink && (
                    <a
                      href={currentOffer.ctaLink}
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(currentOffer.ctaLink!, '_blank');
                      }}
                      className="ml-1.5 text-sm font-normal text-white/90 hover:text-white underline decoration-white/50 hover:decoration-white transition-colors cursor-pointer"
                    >
                      Learn More...
                    </a>
                  )}
                </h3>
              </div>
              {currentOffer.subtitle && (
                <p className="text-sm text-white/95 font-medium drop-shadow-md leading-snug line-clamp-1">
                  {currentOffer.subtitle}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {offers.length > 1 && (
        <>
          <button
            onClick={() => { handleInteraction(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => { handleInteraction(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Progress Bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-10">
            {offers.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm"
              >
                <motion.div
                  className="h-full bg-white rounded-full shadow-lg"
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

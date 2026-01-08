import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
    refetchInterval: 60000,
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

  // Auto-rotate every 5 seconds with progress bar
  useEffect(() => {
    if (!isAutoPlaying || offers.length <= 1) return;
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / 50); // 50 intervals for 5 seconds (100ms each)
      });
    }, 100);

    const slideInterval = setInterval(goToNext, 5000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [isAutoPlaying, goToNext, offers.length]);

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
          {/* Gradient Background Only - No Images */}
          <div className={`absolute inset-0 ${backgroundClass}`} />
          
          {/* Content - Centered with padding for arrows */}
          <div className="relative h-full flex flex-col justify-center px-12 py-4">
            <div className="space-y-1.5 max-w-full">
              <div>
                <h3 className="text-base font-bold text-white drop-shadow-lg leading-tight">
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
              {currentOffer.description && (
                <p className="text-xs text-white/90 leading-relaxed line-clamp-2 drop-shadow-md">
                  {currentOffer.description}
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

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
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
    return null;
  }

  const currentOffer = offers[currentIndex];

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
            <div className={`absolute inset-0 ${backgrou40 bg-card border"
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
          {/* Background Image */}
          {currentOffer.imageUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentOffer.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
          )}
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-4">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white drop-shadow-lg">
                {currentOffer.title}
              </h3>
              {currentOffer.subtitle && (
                <p className="text-sm text-white/95 font-medium drop-shadow-md">
                  {currentOffer.subtitle}
                </p>
              )}
              {currentOffer.description && (
                <p className="text-xs text-white/85 leading-relaxed line-clamp-2 drop-shadow-md">
                  {currentOffer.description}
                </p>
              )}
              {currentOffer.ctaText && currentOffer.ctaLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs bg-white/90 hover:bg-white text-black font-semibold"
                  onClick={() => window.open(currentOffer.ctaLink!, '_blank')}
                >
                  {currentOffer.ctaText}
                </Button>
              )}
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

/**
 * useScrollEdgeEffect — iOS 26 Scroll Edge Blur
 * 
 * Replicates the exact scroll-edge blur behavior from the iOS 26 Figma kit:
 * - Top: 167px gradient mask with backdrop-blur 30px, opacity 0.9
 * - Bottom: 110px gradient mask with backdrop-blur 30px, opacity 0.9
 * 
 * Returns scroll progress (0-1) for driving header blur intensity.
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface ScrollEdgeState {
  /** 0 = at top, 1 = fully scrolled past threshold */
  progress: number;
  /** Raw scroll offset in px */
  scrollY: number;
  /** Whether content is scrolled past the threshold */
  isScrolled: boolean;
}

interface UseScrollEdgeOptions {
  /** Pixels of scroll before the effect reaches full intensity */
  threshold?: number;
  /** Which element to listen to. Defaults to window. */
  element?: React.RefObject<HTMLElement | null>;
}

export function useScrollEdgeEffect({
  threshold = 60,
  element,
}: UseScrollEdgeOptions = {}): ScrollEdgeState {
  const [state, setState] = useState<ScrollEdgeState>({
    progress: 0,
    scrollY: 0,
    isScrolled: false,
  });

  const rafRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    // Cancel any pending frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const y = element?.current
        ? element.current.scrollTop
        : window.scrollY;

      const progress = Math.min(1, Math.max(0, y / threshold));

      setState({
        progress,
        scrollY: y,
        isScrolled: y > 5,
      });
    });
  }, [threshold, element]);

  useEffect(() => {
    const target = element?.current ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial position
    handleScroll();
    return () => {
      target.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, element]);

  return state;
}

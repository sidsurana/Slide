import { useState, useEffect } from "react";

interface SwipeHandlerOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}: SwipeHandlerOptions) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeLeft = distance > threshold;
    const isSwipeRight = distance < -threshold;
    
    if (isSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    }
    
    if (isSwipeRight && onSwipeRight) {
      onSwipeRight();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || mouseStart === null) return;
    
    const distance = mouseStart - e.clientX;
    
    // Optional: Add some visual feedback during dragging here
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || mouseStart === null) return;
    
    const distance = mouseStart - e.clientX;
    const isSwipeLeft = distance > threshold;
    const isSwipeRight = distance < -threshold;
    
    if (isSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    }
    
    if (isSwipeRight && onSwipeRight) {
      onSwipeRight();
    }
    
    setMouseStart(null);
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMouseStart(null);
  };

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}

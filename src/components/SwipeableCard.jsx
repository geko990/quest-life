import React, { useState, useRef } from 'react';

export default function SwipeableCard({
  children,
  onSwipeRight, // e.g. Complete
  onSwipeLeft,  // e.g. Delete/Edit
  disabled = false,
  className = ''
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef(null);

  const handleTouchStart = (e) => {
    if (disabled) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    isHorizontalRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || !isSwiping) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    // Determine direction on first significant movement
    if (isHorizontalRef.current === null) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 6) {
        isHorizontalRef.current = true;
      } else if (Math.abs(diffY) > 6) {
        isHorizontalRef.current = false;
        setIsSwiping(false);
        setTranslateX(0);
        return;
      }
    }

    if (isHorizontalRef.current === true) {
      if (e.cancelable) e.preventDefault();
      // Limit swipe distance
      const clamped = Math.max(-120, Math.min(120, diffX));
      setTranslateX(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    setIsSwiping(false);

    const threshold = 80;
    if (translateX > threshold) {
      if (onSwipeRight) onSwipeRight();
    } else if (translateX < -threshold) {
      if (onSwipeLeft) onSwipeLeft();
    }

    // Reset position smoothly
    setTranslateX(0);
    isHorizontalRef.current = null;
  };

  // Visual indicators based on swipe direction
  const isRight = translateX > 20;
  const isLeft = translateX < -20;

  return (
    <div className="relative overflow-hidden rounded-xl touch-pan-y">
      {/* Background action colors */}
      <div
        className={`absolute inset-0 flex items-center justify-between px-4 font-bold text-xs transition-colors ${
          isRight
            ? 'bg-green-500/30 text-green-400'
            : isLeft
            ? 'bg-red-500/30 text-red-400'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-1.5 opacity-80">
          <span>✓</span>
          <span>Completa</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <span>Modifica</span>
          <span>✏️</span>
        </div>
      </div>

      {/* Foreground card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s ease-out',
          touchAction: 'pan-y'
        }}
        className={`relative bg-bg-card backdrop-blur-md select-none touch-pan-y ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

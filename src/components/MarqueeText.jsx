import React, { useRef, useState, useEffect } from 'react';

/**
 * MarqueeText:
 * Displays single-line text that does not wrap.
 * If the text exceeds the container width, after an initial pause of 2 seconds,
 * it smoothly scrolls to the end, pauses briefly, and loops back.
 * If the text fits comfortably within the container, it remains static with zero animation.
 */
export default function MarqueeText({
  text = '',
  className = '',
  style = {},
  prefix = null,
  speed = 35 // pixels per second for smooth scrolling
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  const checkOverflow = () => {
    if (!containerRef.current || !textRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const textWidth = textRef.current.scrollWidth;
    const diff = textWidth - containerWidth;
    setOverflowDistance(diff > 2 ? diff : 0);
  };

  useEffect(() => {
    checkOverflow();

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = () => checkOverflow();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [text]);

  const hasOverflow = overflowDistance > 0;
  // Dynamic duration calculation so speed is natural and consistent regardless of length
  const scrollDuration = hasOverflow ? Math.max(2.5, overflowDistance / speed) : 0;
  const totalCycleDuration = 2 + scrollDuration + 1.5; // 2s start pause + scroll + 1.5s end pause

  return (
    <div
      ref={containerRef}
      className={`marquee-text-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
        ...style
      }}
      title={text}
    >
      {prefix && (
        <span style={{ flexShrink: 0, marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}>
          {prefix}
        </span>
      )}
      <span
        ref={textRef}
        className={hasOverflow ? 'marquee-text-scrolling' : ''}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          willChange: hasOverflow ? 'transform' : 'auto',
          '--marquee-dist': `-${overflowDistance}px`,
          '--marquee-scroll-time': `${scrollDuration}s`,
          '--marquee-total-time': `${totalCycleDuration}s`
        }}
      >
        {text}
      </span>
    </div>
  );
}

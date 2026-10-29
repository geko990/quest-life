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
    const pad = parseFloat(textRef.current.style.paddingLeft) || 0; // margine della sfumatura, non è testo
    const textWidth = textRef.current.scrollWidth - pad;
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

  // Il prefisso (es. un'emoji) sta fuori dalla zona che scorre: il testo non gli passa sotto e non lo copre
  const textBox = (
    <span
      ref={textRef}
      className={hasOverflow ? 'marquee-text-scrolling' : ''}
      style={{
        display: 'inline-block',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        // 5 px di margine che finiscono sotto la sfumatura: da fermo la prima lettera resta piena
        paddingLeft: hasOverflow ? '5px' : 0,
        willChange: hasOverflow ? 'transform' : 'auto',
        '--marquee-dist': `-${hasOverflow ? overflowDistance + 5 : 0}px`,
        '--marquee-scroll-time': `${scrollDuration}s`,
        '--marquee-total-time': `${totalCycleDuration}s`
      }}
    >
      {text}
    </span>
  );

  return (
    <div
      className={`marquee-text-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...style
      }}
      title={text}
    >
      {prefix && (
        <span style={{ flexShrink: 0, marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}>
          {prefix}
        </span>
      )}
      <div ref={containerRef} style={{
        flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center',
        // mentre scorre, il testo sfuma anche a sinistra invece di essere tagliato di netto
        ...(hasOverflow ? { maskImage: 'linear-gradient(to right, transparent 0, #000 5px)', WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 5px)' } : null)
      }}>
        {textBox}
      </div>
    </div>
  );
}

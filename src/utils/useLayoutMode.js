import { useState, useEffect } from 'react';

/**
 * Hook for detecting screen orientation and device layout mode.
 * Supports auto-detection and user override from settings.
 *
 * Layout modes:
 * - 'portrait': standard smartphone portrait (< 768px width, vertical)
 * - 'landscape': smartphone landscape (rotated, height < 600px, horizontal)
 * - 'tablet': tablet mode (iPad, Android tablet, Surface, or wider screens)
 */
export function useLayoutMode(settings = {}) {
  const getScreenDimensions = () => {
    if (typeof window === 'undefined') {
      return { width: 390, height: 844, isLandscape: false };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Check orientation via matchMedia or aspect ratio
    const mediaOrientationLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isLandscape = mediaOrientationLandscape || width > height;

    return { width, height, isLandscape };
  };

  const [screenInfo, setScreenInfo] = useState(getScreenDimensions);

  useEffect(() => {
    const handleResize = () => {
      setScreenInfo(getScreenDimensions());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const mediaQuery = window.matchMedia('(orientation: landscape)');
    const handleMediaChange = (e) => {
      setScreenInfo(prev => ({ ...prev, isLandscape: e.matches }));
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  const screenModeSetting = settings?.screenMode || 'auto';
  const { width, height, isLandscape: rawLandscape } = screenInfo;

  // Real device detection
  const detectedIsTablet = (width >= 768 && height >= 600) || (height >= 768 && width >= 600);
  const detectedIsLandscape = rawLandscape;

  // Apply user manual setting override if specified
  let effectiveLandscape = detectedIsLandscape;
  let effectiveTablet = detectedIsTablet;
  let effectiveLayout = 'portrait';

  if (screenModeSetting === 'portrait') {
    effectiveLandscape = false;
    effectiveTablet = false;
    effectiveLayout = 'portrait';
  } else if (screenModeSetting === 'landscape') {
    effectiveLandscape = true;
    effectiveTablet = false;
    effectiveLayout = 'landscape';
  } else if (screenModeSetting === 'tablet') {
    effectiveTablet = true;
    effectiveLayout = 'tablet';
  } else {
    // 'auto'
    if (detectedIsTablet) {
      effectiveLayout = 'tablet';
    } else if (detectedIsLandscape) {
      effectiveLayout = 'landscape';
    } else {
      effectiveLayout = 'portrait';
    }
  }

  const isPhoneLandscape = effectiveLandscape && !effectiveTablet;
  const isTabletPortrait = effectiveTablet && !effectiveLandscape;
  const isTabletLandscape = effectiveTablet && effectiveLandscape;

  // Update HTML data attributes for pure CSS styling hooks
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-layout', effectiveLayout);
      root.setAttribute('data-orientation', effectiveLandscape ? 'landscape' : 'portrait');
      root.setAttribute('data-device-mode', effectiveTablet ? 'tablet' : 'mobile');
    }
  }, [effectiveLayout, effectiveLandscape, effectiveTablet]);

  return {
    width,
    height,
    orientation: effectiveLandscape ? 'landscape' : 'portrait',
    isLandscape: effectiveLandscape,
    isTablet: effectiveTablet,
    isPhoneLandscape,
    isTabletPortrait,
    isTabletLandscape,
    layoutMode: effectiveLayout,
    screenModeSetting
  };
}

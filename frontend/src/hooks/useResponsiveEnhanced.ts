/**
 * Enhanced Responsive Hook
 * Mobile-first responsive utilities with exact breakpoints (375px, 768px, 1366px)
 */

import { useState, useEffect, useCallback } from 'react';

interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type NavigatorWithDeviceInfo = Navigator & {
  msMaxTouchPoints?: number;
  connection?: ConnectionInfo;
  mozConnection?: ConnectionInfo;
  webkitConnection?: ConnectionInfo;
};

const getDeviceTypeForWidth = (width: number): DeviceType => {
  if (width < BREAKPOINTS.tablet) {
    return 'mobile';
  }

  if (width < BREAKPOINTS.desktop) {
    return 'tablet';
  }

  return 'desktop';
};

const getCurrentWindowSize = () => ({
  width: getViewportWidth(),
  height: getViewportHeight(),
});

const getNavigatorConnection = (): ConnectionInfo | null => {
  const navigatorWithDeviceInfo = navigator as NavigatorWithDeviceInfo;
  return (
    navigatorWithDeviceInfo.connection ||
    navigatorWithDeviceInfo.mozConnection ||
    navigatorWithDeviceInfo.webkitConnection ||
    null
  );
};

// Exact breakpoints as requested
export const BREAKPOINTS = {
  mobile: 375,    // Mobile (375px)
  tablet: 768,    // Tablet (768px)
  desktop: 1366,  // Desktop (1366px)
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Device types
export const DEVICE_TYPES = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

// Touch detection
export const IS_TOUCH_DEVICE = () => {
  const navigatorWithDeviceInfo = navigator as NavigatorWithDeviceInfo;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigatorWithDeviceInfo.msMaxTouchPoints || 0) > 0
  );
};

// Orientation detection
export const getOrientation = () => {
  if (window.innerHeight > window.innerWidth) {
    return 'portrait';
  }
  return 'landscape';
};

// Viewport utilities
export const getViewportWidth = () => window.innerWidth;
export const getViewportHeight = () => window.innerHeight;

// Safe area insets
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
  };
};

// Device pixel ratio
export const getDevicePixelRatio = () => window.devicePixelRatio || 1;

// Connection information
export const getConnectionInfo = () => {
  const connection = getNavigatorConnection();
  if (!connection) return null;
  
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
};

// Main responsive hook
export const useResponsiveEnhanced = () => {
  const initialWindowSize = getCurrentWindowSize();
  const [windowSize, setWindowSize] = useState({
    width: initialWindowSize.width,
    height: initialWindowSize.height,
  });

  const [deviceType, setDeviceType] = useState<DeviceType>(
    getDeviceTypeForWidth(initialWindowSize.width)
  );
  const [isTouch] = useState(IS_TOUCH_DEVICE());
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(getOrientation());
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>(getSafeAreaInsets());
  const [pixelRatio, setPixelRatio] = useState(getDevicePixelRatio());
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo());

  // Update window size and derived states
  const updateSize = useCallback(() => {
    const width = getViewportWidth();
    const height = getViewportHeight();
    
    setWindowSize({ width, height });
    
    // Determine device type based on exact breakpoints
    setDeviceType(getDeviceTypeForWidth(width));
    
    // Update orientation
    setOrientation(getOrientation());
    
    // Update safe area insets
    setSafeAreaInsets(getSafeAreaInsets());
    
    // Update pixel ratio
    setPixelRatio(getDevicePixelRatio());
    
    // Update connection info
    setConnectionInfo(getConnectionInfo());
  }, [
    setConnectionInfo,
    setDeviceType,
    setOrientation,
    setPixelRatio,
    setSafeAreaInsets,
    setWindowSize,
  ]);

  useEffect(() => {
    // Add event listeners
    const handleResize = () => updateSize();
    const handleOrientationChange = () => {
      setTimeout(updateSize, 100); // Delay to get accurate dimensions
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Connection change listener (if available)
    const initialUpdateTimer = setTimeout(updateSize, 0);
    const connection = getNavigatorConnection();
    connection?.addEventListener?.('change', updateSize);
    
    return () => {
      clearTimeout(initialUpdateTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      connection?.removeEventListener?.('change', updateSize);
    };
  }, [updateSize]);

  // Breakpoint checks
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  
  const isMobileOrTablet = isMobile || isTablet;
  const isTabletOrDesktop = isTablet || isDesktop;
  
  // Width-based checks
  const isBelowMobile = windowSize.width < BREAKPOINTS.mobile;
  const isAboveMobile = windowSize.width >= BREAKPOINTS.mobile;
  const isAboveTablet = windowSize.width >= BREAKPOINTS.tablet;
  const isAboveDesktop = windowSize.width >= BREAKPOINTS.desktop;
  
  // Height-based checks
  const isSmallHeight = windowSize.height < 600;
  const isMediumHeight = windowSize.height >= 600 && windowSize.height < 900;
  const isLargeHeight = windowSize.height >= 900;
  
  // Aspect ratio checks
  const aspectRatio = windowSize.width / windowSize.height;
  const isPortrait = orientation === 'portrait';
  const isLandscape = orientation === 'landscape';
  const isSquare = aspectRatio > 0.9 && aspectRatio < 1.1;
  
  // Device capability checks
  const hasHover = !isTouch;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
  // Network checks
  const isSlowConnection = connectionInfo ? 
    connectionInfo.effectiveType === 'slow-2g' || 
    connectionInfo.effectiveType === '2g' || 
    connectionInfo.saveData : false;
  
  const isFastConnection = connectionInfo ? 
    connectionInfo.effectiveType === '4g' || 
    connectionInfo.effectiveType === '5g' : false;
  
  // High DPI check
  const isHighDPI = pixelRatio > 1;
  const isVeryHighDPI = pixelRatio > 2;
  
  // Safe area checks
  const hasNotch = safeAreaInsets.top > 20;
  const hasHomeIndicator = safeAreaInsets.bottom > 10;
  
  // Responsive value utility
  const getResponsiveValue = useCallback(<T,>(
    values: Partial<Record<DeviceType | 'default', T>>
  ): T => {
    return values[deviceType] || values.default || (values.desktop as T);
  }, [deviceType]);

  // Responsive breakpoint utility
  const getResponsiveBreakpoint = useCallback(<T,>(
    mobile: T,
    tablet?: T,
    desktop?: T
  ): T => {
    if (isMobile) return mobile;
    if (isTablet && tablet !== undefined) return tablet;
    return desktop || tablet || mobile;
  }, [isMobile, isTablet]);

  // Media query utility
  const useMediaQuery = useCallback((query: string) => {
    return window.matchMedia(query).matches;
  }, []);

  return {
    // Basic info
    windowSize,
    deviceType,
    orientation,
    
    // Device checks
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    isTabletOrDesktop,
    
    // Size checks
    isBelowMobile,
    isAboveMobile,
    isAboveTablet,
    isAboveDesktop,
    
    // Height checks
    isSmallHeight,
    isMediumHeight,
    isLargeHeight,
    
    // Orientation checks
    isPortrait,
    isLandscape,
    isSquare,
    aspectRatio,
    
    // Capability checks
    isTouch,
    hasHover,
    hasFinePointer,
    hasCoarsePointer,
    
    // Display checks
    isHighDPI,
    isVeryHighDPI,
    pixelRatio,
    
    // Safe area checks
    safeAreaInsets,
    hasNotch,
    hasHomeIndicator,
    
    // Network checks
    connectionInfo,
    isSlowConnection,
    isFastConnection,
    
    // Utilities
    getResponsiveValue,
    getResponsiveBreakpoint,
    useMediaQuery,
    
    // Breakpoints
    BREAKPOINTS,
    DEVICE_TYPES,
  };
};

// Convenience hooks for specific checks
export const useMobile = () => {
  const { isMobile } = useResponsiveEnhanced();
  return isMobile;
};

export const useTablet = () => {
  const { isTablet } = useResponsiveEnhanced();
  return isTablet;
};

export const useDesktop = () => {
  const { isDesktop } = useResponsiveEnhanced();
  return isDesktop;
};

export const useTouch = () => {
  const { isTouch } = useResponsiveEnhanced();
  return isTouch;
};

export const useOrientation = () => {
  const { orientation } = useResponsiveEnhanced();
  return orientation;
};

export const useSafeArea = () => {
  const { safeAreaInsets } = useResponsiveEnhanced();
  return safeAreaInsets;
};

export const useConnection = () => {
  const { connectionInfo, isSlowConnection, isFastConnection } = useResponsiveEnhanced();
  return { connectionInfo, isSlowConnection, isFastConnection };
};

// Hook for responsive styles
export const useResponsiveStyles = () => {
  const { deviceType, windowSize } = useResponsiveEnhanced();
  
  const getResponsiveClass = useCallback((
    baseClass: string,
    modifiers?: Partial<Record<DeviceType, string>>
  ) => {
    let className = baseClass;
    
    if (modifiers) {
      const modifier = modifiers[deviceType];
      if (modifier) {
        className += ` ${modifier}`;
      }
    }
    
    return className;
  }, [deviceType]);
  
  const getResponsiveSize = useCallback((
    mobileSize: string | number,
    tabletSize?: string | number,
    desktopSize?: string | number
  ) => {
    if (deviceType === 'mobile') return mobileSize;
    if (deviceType === 'tablet' && tabletSize !== undefined) return tabletSize;
    return desktopSize || tabletSize || mobileSize;
  }, [deviceType]);
  
  return {
    getResponsiveClass,
    getResponsiveSize,
    deviceType,
    windowSize,
  };
};

// Hook for responsive animations
export const useResponsiveAnimation = () => {
  const { isSlowConnection, isMobile, windowSize } = useResponsiveEnhanced();
  
  const shouldReduceMotion = useCallback(() => {
    return isSlowConnection || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           isMobile;
  }, [isSlowConnection, isMobile]);
  
  const getAnimationDuration = useCallback((
    mobileDuration: string,
    tabletDuration?: string,
    desktopDuration?: string
  ) => {
    if (shouldReduceMotion()) return '0ms';
    
    if (isMobile) return mobileDuration;
    if (tabletDuration && windowSize.width >= BREAKPOINTS.tablet && windowSize.width < BREAKPOINTS.desktop) {
      return tabletDuration;
    }
    return desktopDuration || tabletDuration || mobileDuration;
  }, [shouldReduceMotion, isMobile, windowSize.width]);
  
  return {
    shouldReduceMotion,
    getAnimationDuration,
  };
};

export default useResponsiveEnhanced;

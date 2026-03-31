/**
 * Enhanced Responsive Hook for Mobile-First Design
 * Provides comprehensive responsive utilities and mobile optimizations
 */

import { useState, useEffect, useCallback } from 'react';

interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
}

interface BatteryManager {
  level?: number;
  charging?: boolean;
  addEventListener?: (type: 'levelchange' | 'chargingchange', listener: () => void) => void;
  removeEventListener?: (type: 'levelchange' | 'chargingchange', listener: () => void) => void;
}

type NavigatorWithDeviceInfo = Navigator & {
  connection?: NetworkConnection;
  getBattery?: () => Promise<BatteryManager>;
};

const getConnection = (): NetworkConnection | undefined =>
  (navigator as NavigatorWithDeviceInfo).connection;

const getBatteryManager = async (): Promise<BatteryManager | null> => {
  const navigatorWithDeviceInfo = navigator as NavigatorWithDeviceInfo;
  if (!navigatorWithDeviceInfo.getBattery) {
    return null;
  }

  return navigatorWithDeviceInfo.getBattery();
};

// Enhanced breakpoint system
export const BREAKPOINTS = {
  xs: 0,      // Extra small devices (portrait phones)
  sm: 640,    // Small devices (landscape phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices (large desktops)
  '2xl': 1536, // 2X large devices (very large desktops)
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Device type detection
export const DEVICE_TYPES = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
  largeDesktop: 'largeDesktop'
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

// Touch detection utilities
export const TOUCH_CAPABILITIES = {
  hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  maxTouchPoints: navigator.maxTouchPoints || 0,
  isCoarse: matchMedia('(pointer: coarse)').matches,
  isFine: matchMedia('(pointer: fine)').matches
};

// Orientation detection
export const ORIENTATIONS = {
  portrait: 'portrait',
  landscape: 'landscape'
} as const;

export type Orientation = typeof ORIENTATIONS[keyof typeof ORIENTATIONS];

// Network quality detection
export const NETWORK_QUALITY = {
  slow: 'slow',      // 2G, slow 3G
  medium: 'medium',  // 3G, 4G
  fast: 'fast',      // 4G, 5G, WiFi
  unknown: 'unknown'
} as const;

export type NetworkQuality = typeof NETWORK_QUALITY[keyof typeof NETWORK_QUALITY];

// Battery level detection
export const BATTERY_LEVELS = {
  critical: 'critical',  // < 20%
  low: 'low',          // 20-50%
  medium: 'medium',     // 50-80%
  high: 'high'         // > 80%
} as const;

export type BatteryLevel = typeof BATTERY_LEVELS[keyof typeof BATTERY_LEVELS];

interface ResponsiveState {
  // Breakpoint information
  breakpoint: Breakpoint;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;
  
  // Device type information
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  
  // Screen information
  width: number;
  height: number;
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Touch capabilities
  hasTouch: boolean;
  isTouchDevice: boolean;
  maxTouchPoints: number;
  isCoarsePointer: boolean;
  isFinePointer: boolean;
  
  // Device capabilities
  pixelRatio: number;
  colorDepth: number;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  prefersHighContrast: boolean;
  
  // Network and battery
  networkQuality: NetworkQuality;
  isOnline: boolean;
  connectionType: string;
  batteryLevel: BatteryLevel;
  batteryCharging: boolean;
  
  // Performance optimizations
  shouldReduceAnimations: boolean;
  shouldOptimizeImages: boolean;
  shouldUseSimplifiedUI: boolean;
  shouldPrefetchData: boolean;
}

const useResponsive = () => {
  const [state, setState] = useState<ResponsiveState>({
    // Initialize with safe defaults
    breakpoint: 'md',
    isXs: false,
    isSm: false,
    isMd: true,
    isLg: false,
    isXl: false,
    is2Xl: false,
    
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    
    width: 1024,
    height: 768,
    orientation: 'landscape',
    isPortrait: false,
    isLandscape: true,
    
    hasTouch: false,
    isTouchDevice: false,
    maxTouchPoints: 0,
    isCoarsePointer: false,
    isFinePointer: true,
    
    pixelRatio: 1,
    colorDepth: 24,
    prefersReducedMotion: false,
    prefersDarkMode: false,
    prefersHighContrast: false,
    
    networkQuality: 'unknown',
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    batteryLevel: 'medium',
    batteryCharging: false,
    
    shouldReduceAnimations: false,
    shouldOptimizeImages: false,
    shouldUseSimplifiedUI: false,
    shouldPrefetchData: true,
  });

  // Update breakpoint information
  const updateBreakpoint = useCallback((width: number) => {
    let breakpoint: Breakpoint = 'md';
    const breakpointStates = {
      isXs: width < BREAKPOINTS.sm,
      isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
      isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
      isXl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'],
      is2Xl: width >= BREAKPOINTS['2xl'],
    };

    // Determine current breakpoint
    if (width < BREAKPOINTS.sm) breakpoint = 'xs';
    else if (width < BREAKPOINTS.md) breakpoint = 'sm';
    else if (width < BREAKPOINTS.lg) breakpoint = 'md';
    else if (width < BREAKPOINTS.xl) breakpoint = 'lg';
    else if (width < BREAKPOINTS['2xl']) breakpoint = 'xl';
    else breakpoint = '2xl';

    return { breakpoint, ...breakpointStates };
  }, []);

  // Update device type
  const updateDeviceType = useCallback((width: number, _height: number) => {
    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg && width < BREAKPOINTS['2xl'];
    const isLargeDesktop = width >= BREAKPOINTS['2xl'];

    let deviceType: DeviceType = 'desktop';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    else if (isLargeDesktop) deviceType = 'largeDesktop';

    return {
      deviceType,
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop
    };
  }, []);

  // Update orientation
  const updateOrientation = useCallback((width: number, height: number) => {
    const isPortrait = height > width;
    const isLandscape = width > height;
    const orientation: Orientation = isPortrait ? 'portrait' : 'landscape';

    return { orientation, isPortrait, isLandscape };
  }, []);

  // Update network quality
  const updateNetworkQuality = useCallback(() => {
    if (!('connection' in navigator)) {
      return {
        networkQuality: 'unknown' as NetworkQuality,
        connectionType: 'unknown',
        isOnline: navigator.onLine
      };
    }

    const connection = getConnection();
    const effectiveType = connection?.effectiveType || 'unknown';
    const downlink = connection?.downlink || 0;

    let networkQuality: NetworkQuality = 'unknown';
    if (downlink < 0.5) networkQuality = 'slow';
    else if (downlink < 2) networkQuality = 'medium';
    else if (downlink > 0) networkQuality = 'fast';

    return {
      networkQuality,
      connectionType: effectiveType,
      isOnline: navigator.onLine
    };
  }, []);

  // Update battery information
  const updateBatteryInfo = useCallback(async () => {
    const battery = await getBatteryManager();
    if (!battery) {
      return {
        batteryLevel: 'medium' as BatteryLevel,
        batteryCharging: false
      };
    }

    try {
      const level = battery.level || 0.5;
      
      let batteryLevel: BatteryLevel = 'medium';
      if (level < 0.2) batteryLevel = 'critical';
      else if (level < 0.5) batteryLevel = 'low';
      else if (level < 0.8) batteryLevel = 'medium';
      else batteryLevel = 'high';

      return {
        batteryLevel,
        batteryCharging: battery.charging || false
      };
    } catch {
      return {
        batteryLevel: 'medium' as BatteryLevel,
        batteryCharging: false
      };
    }
  }, []);

  // Update performance optimizations
  const updatePerformanceOptimizations = useCallback((state: Partial<ResponsiveState>) => {
    const shouldReduceAnimations = state.prefersReducedMotion || 
                                state.networkQuality === 'slow' || 
                                state.batteryLevel === 'critical';

    const shouldOptimizeImages = state.networkQuality === 'slow' || 
                               state.isMobile || 
                               state.batteryLevel === 'low';

    const shouldUseSimplifiedUI = state.isMobile && 
                                 (state.networkQuality === 'slow' || 
                                  state.batteryLevel === 'critical');

    const shouldPrefetchData = state.networkQuality === 'fast' && 
                              !state.batteryCharging && 
                              state.batteryLevel !== 'critical';

    return {
      shouldReduceAnimations,
      shouldOptimizeImages,
      shouldUseSimplifiedUI,
      shouldPrefetchData
    };
  }, []);

  // Main update function
  const updateResponsiveState = useCallback(async () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update basic screen info
    const breakpointInfo = updateBreakpoint(width);
    const deviceTypeInfo = updateDeviceType(width, height);
    const orientationInfo = updateOrientation(width, height);
    const networkInfo = updateNetworkQuality();
    const batteryInfo = await updateBatteryInfo();
    
    // Update preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Update device capabilities
    const pixelRatio = window.devicePixelRatio || 1;
    const colorDepth = screen.colorDepth || 24;
    
    // Create new state
    const newState: ResponsiveState = {
      ...breakpointInfo,
      ...deviceTypeInfo,
      ...orientationInfo,
      ...networkInfo,
      ...batteryInfo,
      width,
      height,
      pixelRatio,
      colorDepth,
      prefersReducedMotion,
      prefersDarkMode,
      prefersHighContrast,
      
      // Touch capabilities
      hasTouch: TOUCH_CAPABILITIES.hasTouch,
      isTouchDevice: TOUCH_CAPABILITIES.hasTouch || TOUCH_CAPABILITIES.maxTouchPoints > 0,
      maxTouchPoints: TOUCH_CAPABILITIES.maxTouchPoints || 0,
      isCoarsePointer: TOUCH_CAPABILITIES.isCoarse || false,
      isFinePointer: TOUCH_CAPABILITIES.isFine || false,
      
      // Device capabilities
      networkQuality: networkInfo.networkQuality,
      isOnline: networkInfo.isOnline,
      connectionType: networkInfo.connectionType,
      batteryLevel: batteryInfo.batteryLevel,
      batteryCharging: batteryInfo.batteryCharging,
      
      // Performance optimizations
      shouldReduceAnimations: Boolean(prefersReducedMotion),
      shouldOptimizeImages: false, // Simplified for now
      shouldUseSimplifiedUI: deviceTypeInfo.isMobile,
      shouldPrefetchData: false, // Simplified for now
    };

    // Update performance optimizations
    const performanceOptimizations = updatePerformanceOptimizations(newState);
    
    setState(prevState => ({
      ...prevState,
      ...newState,
      ...performanceOptimizations
    }));
  }, [updateBreakpoint, updateDeviceType, updateOrientation, updateNetworkQuality, updateBatteryInfo, updatePerformanceOptimizations]);

  // Set up event listeners
  useEffect(() => {
    const initialUpdateTimer = setTimeout(() => {
      void updateResponsiveState();
    }, 0);

    // Resize handler with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateResponsiveState, 150);
    };

    // Orientation change handler
    const handleOrientationChange = () => {
      setTimeout(updateResponsiveState, 100);
    };

    // Network status handlers
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      updateResponsiveState();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      updateResponsiveState();
    };

    // Battery level handler
    let batteryManager: BatteryManager | null = null;
    let batteryHandler: (() => void) | null = null;
    if ('getBattery' in navigator) {
      void getBatteryManager().then((battery) => {
        if (!battery) {
          return;
        }

        batteryManager = battery;
        batteryHandler = () => {
          void updateResponsiveState();
        };
        
        battery.addEventListener?.('levelchange', batteryHandler);
        battery.addEventListener?.('chargingchange', batteryHandler);
      });
    }

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Preference change handlers
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handlePreferenceChange = () => updateResponsiveState();
    
    motionQuery.addEventListener('change', handlePreferenceChange);
    colorSchemeQuery.addEventListener('change', handlePreferenceChange);
    contrastQuery.addEventListener('change', handlePreferenceChange);

    // Cleanup
    return () => {
      clearTimeout(initialUpdateTimer);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (batteryManager && batteryHandler) {
        batteryManager.removeEventListener?.('levelchange', batteryHandler);
        batteryManager.removeEventListener?.('chargingchange', batteryHandler);
      }
      
      motionQuery.removeEventListener('change', handlePreferenceChange);
      colorSchemeQuery.removeEventListener('change', handlePreferenceChange);
      contrastQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, [updateResponsiveState]);

  // Utility functions
  const getResponsiveValue = useCallback(<T,>(
    values: Partial<Record<Breakpoint, T>>,
    defaultValue: T
  ): T => {
    // Find the first matching breakpoint from largest to smallest
    const breakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    
    for (const bp of breakpoints) {
      if (state[`${bp === '2xl' ? 'is2Xl' : `is${bp.charAt(0).toUpperCase() + bp.slice(1)}`}` as keyof ResponsiveState] && values[bp] !== undefined) {
        return values[bp]!;
      }
    }
    
    return defaultValue;
  }, [state]);

  const getMobileOptimizedProps = useCallback(() => {
    return {
      // Touch-friendly sizing
      touchTargetSize: state.isCoarsePointer ? 48 : 32,
      spacing: state.isMobile ? 8 : 16,
      
      // Animation preferences
      reduceAnimations: state.shouldReduceAnimations,
      animationDuration: state.shouldReduceAnimations ? 0 : 200,
      
      // Image optimization
      imageQuality: state.shouldOptimizeImages ? 0.7 : 1.0,
      lazyLoadImages: state.isMobile || state.networkQuality === 'slow',
      
      // UI simplification
      useSimplifiedUI: state.shouldUseSimplifiedUI,
      showAdvancedFeatures: !state.shouldUseSimplifiedUI,
      
      // Performance
      prefetchData: state.shouldPrefetchData,
      debounceTime: state.isMobile ? 300 : 150,
    };
  }, [state]);

  return {
    ...state,
    // Utility functions
    getResponsiveValue,
    getMobileOptimizedProps,
    
    // Common responsive checks
    isMobileOrTablet: state.isMobile || state.isTablet,
    isDesktopOrLarger: state.isDesktop || state.isLargeDesktop,
    isSmallScreen: state.isXs || state.isSm,
    isLargeScreen: state.isLg || state.isXl || state.is2Xl,
    
    // Touch and interaction checks
    canTouch: state.hasTouch,
    shouldUseTouchUI: state.isTouchDevice,
    shouldUseHoverUI: !state.isTouchDevice,
    
    // Performance checks
    isLowPerformance: state.networkQuality === 'slow' || state.batteryLevel === 'critical',
    isHighPerformance: state.networkQuality === 'fast' && state.batteryLevel !== 'critical',
    
    // Accessibility checks
    shouldReduceMotion: state.prefersReducedMotion,
    prefersDarkColorScheme: state.prefersDarkMode,
    needsHighContrast: state.prefersHighContrast,
  };
};

export default useResponsive;

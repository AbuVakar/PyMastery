import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

interface BatteryManager {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

interface NavigatorWithDeviceInfo extends Navigator {
  msMaxTouchPoints?: number;
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
  getBattery?: () => Promise<BatteryManager>;
}

interface FullscreenElementWithPrefixes extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocumentWithPrefixes extends Document {
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

type TouchPropBag = {
  onTouchStart?: unknown;
  onTouchMove?: unknown;
  onTouchEnd?: unknown;
  [key: string]: unknown;
};

const getNavigatorDeviceInfo = (): NavigatorWithDeviceInfo =>
  navigator as NavigatorWithDeviceInfo;

const getNetworkConnection = (): NetworkConnection | undefined => {
  const navigatorWithDeviceInfo = getNavigatorDeviceInfo();
  return (
    navigatorWithDeviceInfo.connection ||
    navigatorWithDeviceInfo.mozConnection ||
    navigatorWithDeviceInfo.webkitConnection
  );
};

interface ViewportSize {
  width: number;
  height: number;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  viewport: ViewportSize;
  pixelRatio: number;
}

interface TouchGesture {
  startX: number;
  startY: number;
  startTime: number;
  type: 'tap' | 'swipe' | 'pinch' | 'long-press';
}

const buildDeviceInfo = (): DeviceInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const navigatorWithDeviceInfo = getNavigatorDeviceInfo();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isTouchDevice:
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigatorWithDeviceInfo.msMaxTouchPoints || 0) > 0,
    orientation: width > height ? 'landscape' : 'portrait',
    viewport: { width, height },
    pixelRatio,
  };
};

export const useViewport = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(buildDeviceInfo);

  const updateDeviceInfo = useCallback(() => {
    setDeviceInfo(buildDeviceInfo());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      updateDeviceInfo();
    };
    
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100); // Delay for orientation change
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
};

export const useTouchGestures = () => {
  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startTime = Date.now();

    setGesture({
      startX,
      startY,
      startTime,
      type: 'tap',
    });

    // Long press detection
    longPressTimeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gesture) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    
    // Clear long press if moved
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      setIsLongPress(false);
    }
    
    // Detect swipe gesture
    const minSwipeDistance = 50;
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      setGesture({
        ...gesture,
        type: 'swipe',
      });
    }
  }, [gesture]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (!gesture) return;
    
    const endTime = Date.now();
    const duration = endTime - gesture.startTime;
    
    // Clear long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    // Determine gesture type
    let gestureType: 'tap' | 'swipe' | 'pinch' | 'long-press' = 'tap';
    
    if (isLongPress) {
      gestureType = 'long-press';
    } else if (gesture.type === 'swipe') {
      gestureType = 'swipe';
    } else if (duration < 200) {
      gestureType = 'tap';
    }
    
    setGesture({
      ...gesture,
      type: gestureType,
    });
    
    // Reset long press state
    setIsLongPress(false);
    
    // Clear gesture after a short delay
    setTimeout(() => setGesture(null), 100);
  }, [gesture, isLongPress]);

  const resetGesture = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    setGesture(null);
    setIsLongPress(false);
  }, []);

  return {
    gesture,
    isLongPress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetGesture,
  };
};

export const useResponsive = () => {
  const deviceInfo = useViewport();
  
  const getResponsiveClasses = useCallback((classes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }) => {
    if (deviceInfo.isMobile && classes.mobile) return classes.mobile;
    if (deviceInfo.isTablet && classes.tablet) return classes.tablet;
    if (deviceInfo.isDesktop && classes.desktop) return classes.desktop;
    return '';
  }, [deviceInfo]);

  const getResponsiveValue = useCallback(<T,>(values: {
    mobile: T;
    tablet?: T;
    desktop?: T;
  }) => {
    if (deviceInfo.isMobile) return values.mobile;
    if (deviceInfo.isTablet && values.tablet) return values.tablet;
    if (deviceInfo.isDesktop && values.desktop) return values.desktop;
    return values.mobile;
  }, [deviceInfo]);

  const isBreakpoint = useCallback((breakpoint: 'sm' | 'md' | 'lg' | 'xl') => {
    const width = deviceInfo.viewport.width;
    switch (breakpoint) {
      case 'sm':
        return width >= 640;
      case 'md':
        return width >= 768;
      case 'lg':
        return width >= 1024;
      case 'xl':
        return width >= 1280;
      default:
        return false;
    }
  }, [deviceInfo]);

  return {
    ...deviceInfo,
    getResponsiveClasses,
    getResponsiveValue,
    isBreakpoint,
  };
};

export const useTouchOptimized = () => {
  const { isTouchDevice } = useViewport();
  
  const getTouchOptimizedProps = useCallback((
    baseProps: TouchPropBag,
    touchProps: TouchPropBag = {}
  ): TouchPropBag => {
    if (isTouchDevice) {
      return {
        ...baseProps,
        ...touchProps,
        onTouchStart: baseProps.onTouchStart,
        onTouchMove: baseProps.onTouchMove,
        onTouchEnd: baseProps.onTouchEnd,
      };
    }
    return baseProps;
  }, [isTouchDevice]);

  const getTouchFeedback = useCallback(() => {
    if (isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(50); // Light vibration for feedback
    }
  }, [isTouchDevice]);

  return {
    isTouchDevice,
    getTouchOptimizedProps,
    getTouchFeedback,
  };
};

export const useScrollBehavior = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToTop = useCallback((smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const scrollToElement = useCallback((elementId: string, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.offsetTop - offset;
      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    }
  }, []);

  return {
    scrollY,
    isScrolling,
    scrollToTop,
    scrollToElement,
  };
};

export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return {
    isVisible,
    entry,
    elementRef,
  };
};

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Initial orientation
    handleOrientationChange();

    // Listen for orientation changes
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const lockOrientation = useCallback((type: 'portrait' | 'landscape') => {
    if ('screen' in window && 'orientation' in window.screen) {
      try {
        const screenOrientation = window.screen.orientation as ScreenOrientation & {
          lock?: (orientationType: 'portrait' | 'landscape') => Promise<void>;
        };
        void screenOrientation.lock?.(type);
      } catch (error) {
        console.warn('Orientation lock not supported:', error);
      }
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    if ('screen' in window && 'orientation' in window.screen) {
      try {
        const screenOrientation = window.screen.orientation as ScreenOrientation & {
          unlock?: () => void;
        };
        screenOrientation.unlock?.();
      } catch (error) {
        console.warn('Orientation unlock not supported:', error);
      }
    }
  }, []);

  return {
    orientation,
    lockOrientation,
    unlockOrientation,
  };
};

export const useDeviceMotion = () => {
  const [motion, setMotion] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 },
    interval: 0,
  });

  useEffect(() => {
    if (!('DeviceMotionEvent' in window)) {
      return;
    }

    const handleMotion = (e: DeviceMotionEvent) => {
      setMotion({
        acceleration: {
          x: e.acceleration?.x || 0,
          y: e.acceleration?.y || 0,
          z: e.acceleration?.z || 0,
        },
        rotation: {
          alpha: e.rotationRate?.alpha || 0,
          beta: e.rotationRate?.beta || 0,
          gamma: e.rotationRate?.gamma || 0,
        },
        interval: e.interval || 0,
      });
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  return motion;
};

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState({
    absolute: 0,
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  useEffect(() => {
    if (!('DeviceOrientationEvent' in window)) {
      return;
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      setOrientation({
        absolute: (e.absolute as unknown as number) || 0,
        alpha: e.alpha || 0,
        beta: e.beta || 0,
        gamma: e.gamma || 0,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return orientation;
};

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    effectiveType: '4g',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = getNetworkConnection();

      setNetworkStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      });
    };

    // Initial status
    updateNetworkStatus();

    // Listen for online/offline changes
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes
    getNetworkConnection()?.addEventListener?.('change', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      getNetworkConnection()?.removeEventListener?.('change', updateNetworkStatus);
    };
  }, []);

  return networkStatus;
};

export const useBatteryStatus = () => {
  const [battery, setBattery] = useState({
    level: 1,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
  });

  useEffect(() => {
    const navigatorWithDeviceInfo = getNavigatorDeviceInfo();
    if (!navigatorWithDeviceInfo.getBattery) {
      return;
    }

    const updateBattery = (batteryInfo: BatteryManager) => {
      setBattery({
        level: batteryInfo.level,
        charging: batteryInfo.charging,
        chargingTime: batteryInfo.chargingTime,
        dischargingTime: batteryInfo.dischargingTime,
      });
    };

    void navigatorWithDeviceInfo.getBattery().then(updateBattery);

    return () => {
      // Battery API doesn't support event listeners in all browsers
    };
  }, []);

  return battery;
};

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    const element = document.documentElement as FullscreenElementWithPrefixes;
    
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    const fullscreenDocument = document as FullscreenDocumentWithPrefixes;

    if (fullscreenDocument.exitFullscreen) {
      await fullscreenDocument.exitFullscreen();
    } else if (fullscreenDocument.webkitExitFullscreen) {
      await fullscreenDocument.webkitExitFullscreen();
    } else if (fullscreenDocument.mozCancelFullScreen) {
      await fullscreenDocument.mozCancelFullScreen();
    } else if (fullscreenDocument.msExitFullscreen) {
      await fullscreenDocument.msExitFullscreen();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
};

export const useAdaptiveLayout = () => {
  const deviceInfo = useViewport();
  const networkStatus = useNetworkStatus();
  const batteryStatus = useBatteryStatus();

  const shouldUseLowPowerMode = useCallback(() => {
    return networkStatus.saveData || batteryStatus.level < 0.2;
  }, [networkStatus.saveData, batteryStatus.level]);

  const getLayoutConfig = useCallback(() => {
    const baseConfig = {
      columns: deviceInfo.isDesktop ? 3 : deviceInfo.isTablet ? 2 : 1,
      sidebarCollapsed: deviceInfo.isMobile,
      animationsEnabled: !shouldUseLowPowerMode(),
      highQualityImages: !shouldUseLowPowerMode() && !networkStatus.saveData,
      autoPlayVideos: !shouldUseLowPowerMode() && !networkStatus.saveData,
      prefetchResources: !shouldUseLowPowerMode(),
    };

    return baseConfig;
  }, [deviceInfo, shouldUseLowPowerMode, networkStatus.saveData]);

  return {
    shouldUseLowPowerMode,
    getLayoutConfig,
    networkStatus,
    batteryStatus,
  };
};

export default useViewport;

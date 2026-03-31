import { useEffect, useState, useCallback, useRef } from 'react';

interface PerformanceMetricPayload {
  name: string;
  value: number;
  unit: string;
  type: 'custom' | 'render';
  data?: Record<string, unknown>;
}

interface WebVitalsSummary {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
}

interface NavigationTimingSummary {
  domLoadTime?: number;
  pageLoadTime?: number;
}

interface PerformanceSummary {
  webVitals: WebVitalsSummary;
  navigationTiming?: NavigationTimingSummary;
}

interface CacheSummary {
  size: number;
  hitRate: number;
  memoryUsage: number;
}

interface PreloadResource {
  href: string;
  as: 'script' | 'style';
}

interface ResourceHintsService {
  preloadCriticalResources: () => Promise<void>;
  preloadBatch: (resources: PreloadResource[]) => Promise<void>;
  prefetch: (resource: string) => Promise<void>;
}

interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkConnection;
};

type GCWindow = Window & {
  gc?: () => void;
};

const getConnection = (): NetworkConnection | undefined =>
  (navigator as NavigatorWithConnection).connection;

const buildNetworkMetrics = (): NetworkMetrics => {
  const connection = getConnection();

  return {
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
    online: navigator.onLine,
  };
};
// Mock implementations for missing performance services
const mockPerformanceMonitor = {
  startMonitoring: () => {},
  stopMonitoring: () => {},
  getSummary: (): PerformanceSummary => ({
    webVitals: { FCP: 0, LCP: 0, FID: 0, CLS: 0, TTFB: 0 },
    navigationTiming: { domLoadTime: 0, pageLoadTime: 0 }
  }),
  recordMetric: (metric: PerformanceMetricPayload) => {
    console.log('Performance metric recorded:', metric);
  }
};

const mockApiCache = {
  getStats: (): CacheSummary => ({ size: 0, hitRate: 0, memoryUsage: 0 }),
  cleanup: async () => {},
  clear: () => {}
};

const mockUiCache = {
  getStats: (): CacheSummary => ({ size: 0, hitRate: 0, memoryUsage: 0 }),
  cleanup: async () => {},
  clear: () => {}
};

const mockUserCache = {
  getStats: (): CacheSummary => ({ size: 0, hitRate: 0, memoryUsage: 0 }),
  cleanup: async () => {},
  clear: () => {}
};

const mockResourceHints: ResourceHintsService = {
  preloadCriticalResources: async () => {},
  preloadBatch: async () => {},
  prefetch: async () => {}
};

const mockSetupResourceHints = () => {};
const mockRegisterServiceWorker = async () => {};

// Use mock implementations
const performanceMonitor = mockPerformanceMonitor;
const apiCache = mockApiCache;
const uiCache = mockUiCache;
const userCache = mockUserCache;
const resourceHints = mockResourceHints;
const setupResourceHints = mockSetupResourceHints;
const registerServiceWorker = mockRegisterServiceWorker;

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
}

interface CacheMetrics {
  apiCache: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
  uiCache: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
  userCache: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}

interface NetworkMetrics {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  online: boolean;
}

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheMetrics | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkMetrics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const optimizationTimer = useRef<NodeJS.Timeout | null>(null);

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    const summary = performanceMonitor.getSummary();
    const webVitals = summary.webVitals;
    
    setMetrics({
      fcp: webVitals.FCP || 0,
      lcp: webVitals.LCP || 0,
      fid: webVitals.FID || 0,
      cls: webVitals.CLS || 0,
      ttfb: webVitals.TTFB || 0,
      domContentLoaded: summary.navigationTiming?.domLoadTime || 0,
      loadComplete: summary.navigationTiming?.pageLoadTime || 0,
    });

    // Collect cache statistics
    setCacheStats({
      apiCache: {
        size: apiCache.getStats().size,
        hitRate: apiCache.getStats().hitRate || 0,
        memoryUsage: apiCache.getStats().memoryUsage || 0,
      },
      uiCache: {
        size: uiCache.getStats().size,
        hitRate: uiCache.getStats().hitRate || 0,
        memoryUsage: uiCache.getStats().memoryUsage || 0,
      },
      userCache: {
        size: userCache.getStats().size,
        hitRate: userCache.getStats().hitRate || 0,
        memoryUsage: userCache.getStats().memoryUsage || 0,
      },
    });

    // Collect network information
    setNetworkInfo(buildNetworkMetrics());
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitor.startMonitoring();
    
    // Setup resource hints and service worker
    setupResourceHints();
    registerServiceWorker().catch(console.warn);
    
    // Collect initial metrics
    collectMetrics();
    
    // Set up periodic metric collection
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
      performanceMonitor.stopMonitoring();
      if (optimizationTimer.current) {
        clearTimeout(optimizationTimer.current);
      }
    };
  }, [collectMetrics]);

  // Optimize performance based on current metrics
  const optimizePerformance = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      // Clean up expired cache entries
      const apiCleanup = apiCache.cleanup();
      const uiCleanup = uiCache.cleanup();
      const userCleanup = userCache.cleanup();
      
      await Promise.all([apiCleanup, uiCleanup, userCleanup]);
      
      // Preload critical resources if on fast connection
      const connection = getConnection();
      if (connection && connection.effectiveType === '4g' && !connection.saveData) {
        await resourceHints.preloadCriticalResources();
      }
      
      // Trigger garbage collection hint
      const gcWindow = window as GCWindow;
      if (typeof gcWindow.gc === 'function') {
        gcWindow.gc();
      }
      
      performanceMonitor.recordMetric({ name: 'optimization_completed', value: 1, unit: 'count', type: 'custom' });
      
    } catch (error) {
      console.error('Performance optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    apiCache.clear();
    uiCache.clear();
    userCache.clear();
    collectMetrics();
  }, [collectMetrics]);

  // Preload resources for a specific route
  const preloadRoute = useCallback(async (route: string) => {
    try {
      // Preload route-specific components
      const components = getRouteComponents(route);
      await resourceHints.preloadBatch(components);
      
      // Preload API data for the route
      const apiEndpoints = getRouteAPIEndpoints(route);
      const promises = apiEndpoints.map(endpoint => 
        resourceHints.prefetch(`${window.location.origin}${endpoint}`)
      );
      
      await Promise.allSettled(promises);
      
      performanceMonitor.recordMetric({ name: 'route_preloaded', value: 1, unit: 'count', type: 'custom', data: { route } });
      
    } catch (error) {
      console.error(`Failed to preload route ${route}:`, error);
    }
  }, []);

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // FCP scoring (0-1000ms is good)
    if (metrics.fcp > 1000) score -= Math.min(20, (metrics.fcp - 1000) / 50);
    
    // LCP scoring (0-2500ms is good)
    if (metrics.lcp > 2500) score -= Math.min(25, (metrics.lcp - 2500) / 100);
    
    // FID scoring (0-100ms is good)
    if (metrics.fid > 100) score -= Math.min(20, (metrics.fid - 100) / 10);
    
    // CLS scoring (0-0.1 is good)
    if (metrics.cls > 0.1) score -= Math.min(25, (metrics.cls - 0.1) * 250);
    
    // TTFB scoring (0-800ms is good)
    if (metrics.ttfb > 800) score -= Math.min(10, (metrics.ttfb - 800) / 100);
    
    return Math.max(0, Math.round(score));
  }, [metrics]);

  // Get performance grade
  const getPerformanceGrade = useCallback(() => {
    const score = getPerformanceScore();
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, [getPerformanceScore]);

  // Get optimization recommendations
  const getOptimizationRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (!metrics) return recommendations;
    
    if (metrics.fcp > 2000) {
      recommendations.push('Optimize initial page load - consider reducing initial bundle size');
    }
    
    if (metrics.lcp > 4000) {
      recommendations.push('Optimize largest contentful paint - compress images and optimize critical resources');
    }
    
    if (metrics.fid > 300) {
      recommendations.push('Reduce first input delay - optimize JavaScript execution and reduce blocking operations');
    }
    
    if (metrics.cls > 0.25) {
      recommendations.push('Reduce cumulative layout shift - ensure proper image dimensions and avoid layout shifts');
    }
    
    if (metrics.ttfb > 1500) {
      recommendations.push('Optimize server response time - consider CDN and server optimization');
    }
    
    if (cacheStats) {
      const totalCacheSize = cacheStats.apiCache.size + cacheStats.uiCache.size + cacheStats.userCache.size;
      if (totalCacheSize > 100) {
        recommendations.push('Consider cache cleanup - cache size is getting large');
      }
      
      const avgHitRate = (cacheStats.apiCache.hitRate + cacheStats.uiCache.hitRate + cacheStats.userCache.hitRate) / 3;
      if (avgHitRate < 0.5) {
        recommendations.push('Improve cache hit rate - review caching strategy and TTL values');
      }
    }
    
    if (networkInfo && networkInfo.saveData) {
      recommendations.push('Data saver mode is enabled - consider reducing resource usage');
    }
    
    return recommendations;
  }, [metrics, cacheStats, networkInfo]);

  // Auto-optimization
  useEffect(() => {
    const score = getPerformanceScore();
    
    // Auto-optimize if performance score is low
    if (score < 70 && !isOptimizing) {
      optimizationTimer.current = setTimeout(() => {
        optimizePerformance();
      }, 5000); // Wait 5 seconds before optimizing
    }
    
    return () => {
      if (optimizationTimer.current) {
        clearTimeout(optimizationTimer.current);
      }
    };
  }, [getPerformanceScore, isOptimizing, optimizePerformance]);

  return {
    metrics,
    cacheStats,
    networkInfo,
    isOptimizing,
    performanceScore: getPerformanceScore(),
    performanceGrade: getPerformanceGrade(),
    recommendations: getOptimizationRecommendations(),
    optimizePerformance,
    clearAllCaches,
    preloadRoute,
    collectMetrics,
  };
};

// Helper functions for route-specific optimization
function getRouteComponents(route: string) {
  const componentMap: Record<string, PreloadResource[]> = {
    '/dashboard': [
      { href: '/js/dashboard.js', as: 'script' },
      { href: '/css/dashboard.css', as: 'style' },
    ],
    '/courses': [
      { href: '/js/courses.js', as: 'script' },
      { href: '/css/courses.css', as: 'style' },
    ],
    '/problems': [
      { href: '/js/problems.js', as: 'script' },
      { href: '/css/problems.css', as: 'style' },
    ],
  };
  
  return componentMap[route] || [];
}

function getRouteAPIEndpoints(route: string) {
  const endpointMap: Record<string, string[]> = {
    '/dashboard': ['/api/dashboard/stats', '/api/dashboard/activity'],
    '/courses': ['/api/courses', '/api/courses/featured'],
    '/problems': ['/api/problems', '/api/problems/recent'],
  };
  
  return endpointMap[route] || [];
}

// Performance monitoring for specific components
export const useComponentPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number | null>(null);
  const [renderMetrics, setRenderMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  });

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const renderTime =
      lastRenderTime.current === null ? 0 : now - lastRenderTime.current;
    
    performanceMonitor.recordMetric({
      name: `${componentName}_render_count`,
      value: renderCount.current,
      unit: 'count',
      type: 'render'
    });
    
    performanceMonitor.recordMetric({
      name: `${componentName}_render_time`,
      value: renderTime,
      unit: 'ms',
      type: 'render'
    });
    
    setRenderMetrics({
      renderCount: renderCount.current,
      averageRenderTime: renderTime,
      lastRenderTime: now,
    });
    
    lastRenderTime.current = now;
  }, [componentName]);

  return renderMetrics;
};

// Network-aware loading hook
export const useNetworkAwareLoading = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkMetrics | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState<'aggressive' | 'normal' | 'conservative'>('normal');

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = getConnection();
      if (connection) {
        const info = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          online: navigator.onLine,
        };
        setNetworkInfo(info);
        
        // Determine loading strategy
        if (connection.effectiveType === '4g' && connection.downlink > 2 && !connection.saveData) {
          setLoadingStrategy('aggressive');
        } else if (connection.effectiveType === 'slow-2g' || connection.saveData) {
          setLoadingStrategy('conservative');
        } else {
          setLoadingStrategy('normal');
        }
      } else {
        setNetworkInfo({
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0,
          saveData: false,
          online: navigator.onLine,
        });
      }
    };

    updateNetworkInfo();
    
    // Listen for network changes
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    
    getConnection()?.addEventListener?.('change', updateNetworkInfo);
    
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      getConnection()?.removeEventListener?.('change', updateNetworkInfo);
    };
  }, []);

  return {
    networkInfo,
    loadingStrategy,
    shouldPreloadImages: loadingStrategy !== 'conservative',
    shouldPreloadVideos: loadingStrategy === 'aggressive',
    shouldUseLowQualityImages: loadingStrategy === 'conservative',
  };
};

export default usePerformanceOptimization;

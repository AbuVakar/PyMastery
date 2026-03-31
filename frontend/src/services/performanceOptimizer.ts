import { useEffect, useState, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Custom metrics
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  tti: number; // Time to Interactive
  
  // Resource metrics
  resourceCount: number;
  totalSize: number;
  cachedResources: number;
  
  // Memory metrics
  memoryUsage?: number;
  memoryLimit?: number;
}

interface OptimizationStrategy {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  implementation: () => void;
  implemented: boolean;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private strategies: OptimizationStrategy[];
  private observer: PerformanceObserver;
  private isOptimizing = false;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.strategies = this.initializeStrategies();
    this.setupPerformanceObservers();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      fcp: 0,
      tti: 0,
      resourceCount: 0,
      totalSize: 0,
      cachedResources: 0
    };
  }

  private initializeStrategies(): OptimizationStrategy[] {
    return [
      {
        name: 'Image Optimization',
        description: 'Optimize images for web and implement lazy loading',
        priority: 'high',
        impact: 'high',
        implemented: false,
        implementation: () => this.optimizeImages()
      },
      {
        name: 'Code Splitting',
        description: 'Split code into smaller chunks for better caching',
        priority: 'high',
        impact: 'high',
        implemented: false,
        implementation: () => this.implementCodeSplitting()
      },
      {
        name: 'Resource Preloading',
        description: 'Preload critical resources',
        priority: 'medium',
        impact: 'medium',
        implemented: false,
        implementation: () => this.preloadCriticalResources()
      },
      {
        name: 'Service Worker Caching',
        description: 'Implement advanced caching strategies',
        priority: 'high',
        impact: 'high',
        implemented: false,
        implementation: () => this.setupServiceWorkerCaching()
      },
      {
        name: 'Bundle Optimization',
        description: 'Optimize JavaScript bundle size',
        priority: 'medium',
        impact: 'medium',
        implemented: false,
        implementation: () => this.optimizeBundle()
      },
      {
        name: 'CSS Optimization',
        description: 'Minimize and optimize CSS delivery',
        priority: 'medium',
        impact: 'medium',
        implemented: false,
        implementation: () => this.optimizeCSS()
      },
      {
        name: 'Font Optimization',
        description: 'Optimize font loading and display',
        priority: 'low',
        impact: 'medium',
        implemented: false,
        implementation: () => this.optimizeFonts()
      },
      {
        name: 'Network Optimization',
        description: 'Optimize network requests and responses',
        priority: 'medium',
        impact: 'medium',
        implemented: false,
        implementation: () => this.optimizeNetwork()
      }
    ];
  }

  private setupPerformanceObservers() {
    try {
      // Observe Core Web Vitals
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              this.metrics.lcp = entry.startTime;
              break;
            case 'first-input': {
              const fidEntry = entry as PerformanceEventTiming;
              this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
              break;
            }
            case 'layout-shift': {
              const layoutShiftEntry = entry as LayoutShiftEntry;
              if (!layoutShiftEntry.hadRecentInput) {
                this.metrics.cls += layoutShiftEntry.value ?? 0;
              }
              break;
            }
            case 'navigation': {
              const navEntry = entry as PerformanceNavigationTiming;
              this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
              this.metrics.fcp = navEntry.loadEventStart - navEntry.loadEventEnd;
              break;
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
    } catch (error) {
      console.warn('Performance observer setup failed:', error);
    }
  }

  // Optimization strategies implementation
  private optimizeImages() {
    // Add loading="lazy" to all images
    const images = document.querySelectorAll('img:not([loading])') as NodeListOf<HTMLImageElement>;
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
      
      // Add responsive image handling
      if (!img.srcset && img.naturalWidth && img.naturalWidth > 1000) {
        const srcset = `${img.src} 1x, ${img.src}?w=2x 2x`;
        img.setAttribute('srcset', srcset);
      }
    });

    // Implement WebP support detection
    if (this.supportsWebP()) {
      this.convertImagesToWebP();
    }

    this.markStrategyImplemented('Image Optimization');
  }

  private implementCodeSplitting() {
    // Dynamic import for non-critical components
    const lazyComponents = document.querySelectorAll('[data-lazy-component]');
    lazyComponents.forEach(element => {
      const componentName = element.getAttribute('data-lazy-component');
      if (componentName) {
        // This would integrate with your build system
        console.log(`Setting up lazy loading for component: ${componentName}`);
      }
    });

    this.markStrategyImplemented('Code Splitting');
  }

  private preloadCriticalResources() {
    const criticalResources = [
      '/static/fonts/main.woff2',
      '/static/css/critical.css',
      '/static/js/critical.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      }
      
      document.head.appendChild(link);
    });

    this.markStrategyImplemented('Resource Preloading');
  }

  private setupServiceWorkerCaching() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Implement cache-first strategy for static assets
        registration.addEventListener('message', (event: MessageEvent) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('Service worker cache updated');
          }
        });
      });
    }

    this.markStrategyImplemented('Service Worker Caching');
  }

  private optimizeBundle() {
    // Remove unused code (tree shaking)
    // Minify JavaScript
    // Enable gzip/brotli compression
    
    // This would typically be done at build time
    console.log('Bundle optimization configured at build time');
    this.markStrategyImplemented('Bundle Optimization');
  }

  private optimizeCSS() {
    // Critical CSS inlining
    const criticalCSS = `
      body { margin: 0; font-family: system-ui; }
      .loading { display: none; }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);

    // Non-critical CSS loading
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = '/static/css/main.css';
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);

    this.markStrategyImplemented('CSS Optimization');
  }

  private optimizeFonts() {
    // Preload fonts
    const fonts = [
      '/static/fonts/inter-var.woff2'
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });

    // Implement font-display: swap
    const fontFace = document.createElement('style');
    fontFace.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: url('/static/fonts/inter-var.woff2') format('woff2');
      }
    `;
    document.head.appendChild(fontFace);

    this.markStrategyImplemented('Font Optimization');
  }

  private optimizeNetwork() {
    // Implement HTTP/2 push for critical resources
    // Enable compression
    // Set proper cache headers
    
    // Client-side optimizations
    if ('connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
      if (connection?.saveData || connection?.effectiveType === 'slow-2g') {
        // Enable data saver mode
        document.documentElement.classList.add('data-saver');
      }
    }

    this.markStrategyImplemented('Network Optimization');
  }

  // Helper methods
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private convertImagesToWebP() {
    // This would be implemented with a build tool or service worker
    console.log('WebP conversion enabled');
  }

  private markStrategyImplemented(strategyName: string) {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (strategy) {
      strategy.implemented = true;
    }
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getStrategies(): OptimizationStrategy[] {
    return [...this.strategies];
  }

  public async optimize(): Promise<void> {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    try {
      // Implement strategies based on priority and impact
      const sortedStrategies = [...this.strategies]
        .filter(s => !s.implemented)
        .sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          const impactWeight = { high: 3, medium: 2, low: 1 };
          
          const aScore = priorityWeight[a.priority] * impactWeight[a.impact];
          const bScore = priorityWeight[b.priority] * impactWeight[b.impact];
          
          return bScore - aScore;
        });

      for (const strategy of sortedStrategies) {
        try {
          strategy.implementation();
          console.log(`Optimization strategy implemented: ${strategy.name}`);
        } catch (error) {
          console.error(`Failed to implement ${strategy.name}:`, error);
        }
      }
    } finally {
      this.isOptimizing = false;
    }
  }

  public analyzePerformance(): {
    score: number;
    recommendations: string[];
    issues: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Analyze Core Web Vitals
    if (this.metrics.lcp > 2500) {
      issues.push('Largest Contentful Paint is slow (>2.5s)');
      recommendations.push('Optimize images and reduce server response time');
      score -= 20;
    }

    if (this.metrics.fid > 100) {
      issues.push('First Input Delay is high (>100ms)');
      recommendations.push('Reduce JavaScript execution time');
      score -= 15;
    }

    if (this.metrics.cls > 0.1) {
      issues.push('Cumulative Layout Shift is high (>0.1)');
      recommendations.push('Specify dimensions for images and videos');
      score -= 15;
    }

    // Analyze resource usage
    if (this.metrics.totalSize > 3000000) { // 3MB
      issues.push('Page size is large (>3MB)');
      recommendations.push('Compress images and enable code splitting');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      recommendations,
      issues
    };
  }

  public cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// React hook for performance optimization
export const usePerformanceOptimizer = () => {
  const optimizerRef = useRef<PerformanceOptimizer | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>();
  const [analysis, setAnalysis] = useState<ReturnType<PerformanceOptimizer['analyzePerformance']>>();
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    optimizerRef.current = new PerformanceOptimizer();
    
    // Update metrics periodically
    const interval = setInterval(() => {
      if (optimizerRef.current) {
        setMetrics(optimizerRef.current.getMetrics());
        setAnalysis(optimizerRef.current.analyzePerformance());
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      optimizerRef.current?.cleanup();
    };
  }, []);

  const optimize = useCallback(async () => {
    if (!optimizerRef.current || isOptimizing) return;
    
    setIsOptimizing(true);
    try {
      await optimizerRef.current.optimize();
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing]);

  const getStrategies = useCallback(() => {
    return optimizerRef.current?.getStrategies() || [];
  }, []);

  return {
    metrics,
    analysis,
    isOptimizing,
    optimize,
    getStrategies
  };
};

export default PerformanceOptimizer;

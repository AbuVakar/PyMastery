// Resource hints and preloading service for performance optimization
import { useEffect } from 'react';

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

interface ResourceHint {
  href: string;
  as?: string;
  type?: string;
  crossOrigin?: string;
  media?: string;
}

interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto';
  timeout?: number;
  retryCount?: number;
}

class ResourceHintsService {
  private preloadedResources = new Set<string>();
  private prefetchedResources = new Set<string>();
  private preconnectedOrigins = new Set<string>();

  /**
   * Preload a critical resource
   */
  preload(href: string, options: Partial<ResourceHint & PreloadOptions> = {}): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      
      if (options.as) link.as = options.as;
      if (options.type) link.type = options.type;
      if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
      if (options.media) link.media = options.media;

      const timeout = options.timeout || 10000;
      const timer = setTimeout(() => {
        this.preloadedResources.delete(href);
        reject(new Error(`Preload timeout for ${href}`));
      }, timeout);

      link.onload = () => {
        clearTimeout(timer);
        this.preloadedResources.add(href);
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timer);
        reject(new Error(`Failed to preload ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch a resource for future navigation
   */
  prefetch(href: string, options: Partial<ResourceHint> = {}): void {
    if (this.prefetchedResources.has(href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    if (options.as) link.as = options.as;
    if (options.type) link.type = options.type;
    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;

    document.head.appendChild(link);
    this.prefetchedResources.add(href);
  }

  /**
   * Preconnect to an origin
   */
  preconnect(origin: string, options: { crossOrigin?: string } = {}): void {
    if (this.preconnectedOrigins.has(origin)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    
    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;

    document.head.appendChild(link);
    this.preconnectedOrigins.add(origin);
  }

  /**
   * DNS prefetch for an origin
   */
  dnsPrefetch(origin: string): void {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;
    document.head.appendChild(link);
  }

  /**
   * Preload critical CSS
   */
  preloadCSS(href: string): Promise<void> {
    return this.preload(href, {
      as: 'style',
      type: 'text/css',
      href: href
    });
  }

  /**
   * Preload critical JavaScript
   */
  preloadJS(href: string, options: { crossOrigin?: string } = {}): Promise<void> {
    return this.preload(href, {
      as: 'script',
      type: 'application/javascript',
      href: href,
      crossOrigin: options.crossOrigin
    });
  }

  /**
   * Preload an image
   */
  preloadImage(href: string): Promise<void> {
    return this.preload(href, {
      as: 'image',
      href: href
    });
  }

  /**
   * Preload a font
   */
  preloadFont(href: string, options: { crossOrigin?: string } = {}): Promise<void> {
    return this.preload(href, {
      as: 'font',
      type: 'font/woff2',
      href: href,
      crossOrigin: options.crossOrigin || 'anonymous'
    });
  }

  /**
   * Batch preload multiple resources
   */
  async preloadBatch(resources: Array<ResourceHint & PreloadOptions>): Promise<void> {
    const promises = resources.map(resource => 
      this.preload(resource.href, resource).catch(error => {
        console.warn(`Failed to preload ${resource.href}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Preload resources based on user behavior prediction
   */
  predictivePreload(): void {
    // Preload resources that are likely to be needed next
    const likelyNextPages = this.predictNextPages();
    
    likelyNextPages.forEach(page => {
      this.prefetch(page);
    });
  }

  /**
   * Predict which pages the user might visit next
   */
  private predictNextPages(): string[] {
    // This is a simple implementation - you can make it more sophisticated
    const currentPath = window.location.pathname;
    const predictions: string[] = [];

    // Based on current path, predict likely next pages
    if (currentPath === '/') {
      predictions.push('/dashboard', '/courses', '/problems');
    } else if (currentPath.includes('/courses')) {
      predictions.push('/problems', '/dashboard');
    } else if (currentPath.includes('/problems')) {
      predictions.push('/courses', '/leaderboard');
    } else if (currentPath.includes('/dashboard')) {
      predictions.push('/profile', '/analytics');
    }

    return predictions.map(path => `${window.location.origin}${path}`);
  }

  /**
   * Setup intersection observer for predictive preloading
   */
  setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadHref = element.getAttribute('data-preload');
            
            if (preloadHref) {
              this.preload(preloadHref).catch(error => {
                console.warn(`Failed to preload ${preloadHref}:`, error);
              });
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    // Observe elements with data-preload attribute
    document.querySelectorAll('[data-preload]').forEach(element => {
      observer.observe(element);
    });
  }

  /**
   * Get resource hints statistics
   */
  getStats() {
    return {
      preloadedResources: this.preloadedResources.size,
      prefetchedResources: this.prefetchedResources.size,
      preconnectedOrigins: this.preconnectedOrigins.size,
      totalHints: this.preloadedResources.size + this.prefetchedResources.size + this.preconnectedOrigins.size,
    };
  }

  /**
   * Clear all resource hints
   */
  clear(): void {
    // Remove all added link elements
    const links = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"], link[rel="preconnect"], link[rel="dns-prefetch"]');
    links.forEach(link => link.remove());

    // Clear tracking sets
    this.preloadedResources.clear();
    this.prefetchedResources.clear();
    this.preconnectedOrigins.clear();
  }
}

// Create singleton instance
export const resourceHints = new ResourceHintsService();

// Critical resources that should be preloaded
export const preloadCriticalResources = async (): Promise<void> => {
  const criticalResources = [
    // Critical CSS
    { href: '/css/critical.css', as: 'style', type: 'text/css' },
    
    // Critical JavaScript
    { href: '/js/critical.js', as: 'script', type: 'application/javascript' },
    
    // Critical fonts
    { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    
    // Hero images
    { href: '/images/hero-banner.webp', as: 'image' },
  ];

  await resourceHints.preloadBatch(criticalResources);
};

// Preconnect to external origins
export const setupPreconnections = (): void => {
  const origins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.pymastery.com',
  ];

  origins.forEach(origin => {
    resourceHints.preconnect(origin);
  });
};

// Setup resource hints on page load
export const setupResourceHints = (): void => {
  // Setup preconnections
  setupPreconnections();
  
  // Preload critical resources
  preloadCriticalResources().catch(error => {
    console.warn('Failed to preload critical resources:', error);
  });
  
  // Setup intersection observer for predictive preloading
  resourceHints.setupIntersectionObserver();
  
  // Start predictive preloading after a delay
  setTimeout(() => {
    resourceHints.predictivePreload();
  }, 2000);
};

// React hook for resource hints
export const useResourceHints = () => {
  useEffect(() => {
    setupResourceHints();
    
    return () => {
      // Cleanup if needed
      resourceHints.clear();
    };
  }, []);
};

// Service Worker registration for caching
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service Worker registered:', registration);
      
      // Wait for the service worker to be activated
      if (registration.active) {
        console.log('Service Worker is active');
      } else {
        registration.addEventListener('updatefound', () => {
          console.log('New Service Worker found');
        });
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Network Information API for adaptive loading
export const getNetworkInfo = () => {
  const connection = (navigator as NavigatorWithConnection).connection;

  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
};

// Adaptive loading based on network conditions
export const adaptiveLoading = {
  shouldPreloadImages: (): boolean => {
    const networkInfo = getNetworkInfo();
    if (!networkInfo) return true;
    
    // Don't preload images on slow connections or when data saving is enabled
    return networkInfo.effectiveType !== 'slow-2g' && 
           networkInfo.effectiveType !== '3g' && 
           !networkInfo.saveData;
  },

  shouldPreloadVideos: (): boolean => {
    const networkInfo = getNetworkInfo();
    if (!networkInfo) return true;
    
    // Only preload videos on fast connections
    return networkInfo.effectiveType === '4g' && 
           networkInfo.downlink > 2 && 
           !networkInfo.saveData;
  },

  getCacheStrategy: (): 'aggressive' | 'normal' | 'conservative' => {
    const networkInfo = getNetworkInfo();
    if (!networkInfo) return 'normal';
    
    if (networkInfo.effectiveType === '4g' && networkInfo.downlink > 5) {
      return 'aggressive';
    } else if (networkInfo.effectiveType === 'slow-2g' || networkInfo.saveData) {
      return 'conservative';
    }
    return 'normal';
  },
};

export default resourceHints;

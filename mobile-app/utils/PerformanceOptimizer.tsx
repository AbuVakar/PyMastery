import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  InteractionManager,
  AppState,
  NetInfo,
} from 'react-native';
import { useResponsive } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

export interface PerformanceConfig {
  enableLazyLoading?: boolean;
  enableImageCaching?: boolean;
  enableVirtualization?: boolean;
  batchSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
  keyExtractor?: (item: any, index: number) => string;
  onEndReachedThreshold?: number;
  onEndReached?: () => void;
  refreshControl?: any;
}

export interface OptimizedListProps<T> extends PerformanceConfig {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  ItemSeparatorComponent?: React.ReactNode;
  contentContainerStyle?: any;
  style?: any;
  testID?: string;
}

export const OptimizedFlatList = <T,>({
  data,
  renderItem,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  ItemSeparatorComponent,
  contentContainerStyle,
  style,
  testID,
  enableLazyLoading = true,
  enableVirtualization = true,
  batchSize = 10,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  windowSize = 10,
  removeClippedSubviews = true,
  getItemLayout,
  keyExtractor,
  onEndReachedThreshold = 0.5,
  onEndReached,
  refreshControl,
}: OptimizedListProps<T>) => {
  const [isReady, setIsReady] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  useEffect(() => {
    // Delay rendering until after interactions complete
    InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
  }, []);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const indices = viewableItems.map((item: any) => item.index);
      const start = Math.min(...indices);
      const end = Math.max(...indices);
      setVisibleIndices({ start, end });
    }
  }, []);

  const memoizedRenderItem = useCallback(renderItem, [renderItem]);

  const viewabilityConfig = useMemo(() => ({
    itemVisibilityPercentThreshold: 50,
    minimumViewTime: 300,
  }), []);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      contentContainerStyle={contentContainerStyle}
      style={style}
      testID={testID}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={refreshControl}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      scrollEventThrottle={16}
      updateCellsBatchingPeriod={50}
      decelerationRate="normal"
      showsVerticalScrollIndicator={false}
    />
  );
};

export interface OptimizedImageProps {
  source: any;
  style?: any;
  placeholder?: string;
  fallback?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  cacheEnabled?: boolean;
  blurRadius?: number;
  testID?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  fallback,
  resizeMode = 'cover',
  onLoad,
  onError,
  cacheEnabled = true,
  blurRadius = 0,
  testID,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSource, setImageSource] = useState(source);

  useEffect(() => {
    setImageSource(source);
    setIsLoading(true);
    setHasError(false);
  }, [source]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    
    if (fallback && imageSource !== fallback) {
      setImageSource(fallback);
    }
    
    onError?.(error);
  }, [onError, fallback, imageSource]);

  if (hasError && !fallback) {
    return (
      <View style={[styles.imageErrorContainer, style]}>
        <Text style={styles.imageErrorText}>Failed to load image</Text>
      </View>
    );
  }

  return (
    <View style={[styles.imageContainer, style]}>
      {isLoading && placeholder && (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Loading...</Text>
        </View>
      )}
      <Image
        source={imageSource}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        blurRadius={isLoading ? blurRadius : 0}
        testID={testID}
      />
    </View>
  );
};

export interface PerformanceMonitorProps {
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  enabled?: boolean;
  updateInterval?: number;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  renderTime: number;
  timestamp: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onPerformanceUpdate,
  enabled = true,
  updateInterval = 1000,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    renderTime: 0,
    timestamp: Date.now(),
  });
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const calculateFPS = () => {
      const now = Date.now();
      const delta = now - lastFrameTime.current;
      const fps = Math.round(1000 / (delta / frameCount.current));
      
      frameCount.current = 0;
      lastFrameTime.current = now;
      
      return fps;
    };

    const updateMetrics = () => {
      const fps = calculateFPS();
      const memoryUsage = Platform.OS === 'ios' ? 0 : 0; // Would need native module
      const cpuUsage = 0; // Would need native module
      const networkLatency = 0; // Would need network monitoring
      const renderTime = 0; // Would need render time measurement

      const newMetrics: PerformanceMetrics = {
        fps,
        memoryUsage,
        cpuUsage,
        networkLatency,
        renderTime,
        timestamp: Date.now(),
      };

      setMetrics(newMetrics);
      onPerformanceUpdate?.(newMetrics);
    };

    intervalRef.current = setInterval(updateMetrics, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, updateInterval, onPerformanceUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const handleFrame = () => {
      frameCount.current++;
    };

    const animationFrame = requestAnimationFrame(handleFrame);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [enabled]);

  return null;
};

export interface MemoryManagerProps {
  maxMemoryUsage?: number;
  cleanupInterval?: number;
  onMemoryWarning?: () => void;
  onMemoryCleanup?: () => void;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({
  maxMemoryUsage = 100 * 1024 * 1024, // 100MB
  cleanupInterval = 30000, // 30 seconds
  onMemoryWarning,
  onMemoryCleanup,
}) => {
  const [memoryUsage, setMemoryUsage] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkMemory = () => {
      // This would need a native module to get actual memory usage
      const currentUsage = 0; // Placeholder
      
      setMemoryUsage(currentUsage);
      
      if (currentUsage > maxMemoryUsage) {
        onMemoryWarning?.();
        performCleanup();
      }
    };

    const performCleanup = () => {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      onMemoryCleanup?.();
    };

    intervalRef.current = setInterval(checkMemory, cleanupInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [maxMemoryUsage, cleanupInterval, onMemoryWarning, onMemoryCleanup]);

  return null;
};

export interface NetworkManagerProps {
  onConnectivityChange?: (isConnected: boolean) => void;
  onNetworkSpeedChange?: (speed: 'slow' | 'medium' | 'fast') => void;
  enableOfflineMode?: boolean;
  cacheSize?: number;
}

export const NetworkManager: React.FC<NetworkManagerProps> = ({
  onConnectivityChange,
  onNetworkSpeedChange,
  enableOfflineMode = true,
  cacheSize = 50 * 1024 * 1024, // 50MB
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsOnline(connected);
      
      onConnectivityChange?.(connected);
      
      // Determine network speed based on connection type
      if (state.details) {
        if (state.type === 'wifi') {
          setNetworkSpeed('fast');
        } else if (state.type === 'cellular') {
          const effectiveType = (state.details as any).effectiveType;
          switch (effectiveType) {
            case '2g':
              setNetworkSpeed('slow');
              break;
            case '3g':
              setNetworkSpeed('medium');
              break;
            case '4g':
              setNetworkSpeed('fast');
              break;
            default:
              setNetworkSpeed('medium');
          }
        } else {
          setNetworkSpeed('medium');
        }
        
        onNetworkSpeedChange?.(networkSpeed);
      }
    });

    return () => unsubscribe();
  }, [onConnectivityChange, onNetworkSpeedChange, networkSpeed]);

  return null;
};

export interface BatchProcessorProps {
  items: any[];
  batchSize?: number;
  processingDelay?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  onBatchComplete?: (batch: any[], startIndex: number) => void;
  style?: any;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  items,
  batchSize = 10,
  processingDelay = 100,
  renderItem,
  onBatchComplete,
  style,
}) => {
  const [processedItems, setProcessedItems] = useState<any[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  useEffect(() => {
    if (currentBatchIndex >= items.length) return;

    const processBatch = () => {
      const endIndex = Math.min(currentBatchIndex + batchSize, items.length);
      const batch = items.slice(currentBatchIndex, endIndex);
      
      setProcessedItems(prev => [...prev, ...batch]);
      onBatchComplete?.(batch, currentBatchIndex);
      setCurrentBatchIndex(endIndex);
    };

    const timer = setTimeout(processBatch, processingDelay);
    return () => clearTimeout(timer);
  }, [currentBatchIndex, items, batchSize, processingDelay, onBatchComplete]);

  return (
    <View style={style}>
      {processedItems.map((item, index) => renderItem(item, index))}
    </View>
  );
};

export interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  enabled?: boolean;
  onLoad?: () => void;
  style?: any;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  threshold = 100,
  enabled = true,
  onLoad,
  style,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (viewRef.current) {
      // In React Native, we'd use a different approach
      // This is a simplified version
      setIsVisible(true);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [enabled, threshold]);

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
      onLoad?.();
    }
  }, [isVisible, hasLoaded, onLoad]);

  if (!isVisible) {
    return <View ref={viewRef} style={style}>{placeholder}</View>;
  }

  return <View ref={viewRef} style={style}>{children}</View>;
};

export interface CacheManagerProps {
  maxSize?: number;
  ttl?: number;
  onEvict?: (key: string, value: any) => void;
}

export class CacheManager {
  private cache = new Map<string, { value: any; timestamp: number; size: number }>();
  private maxSize: number;
  private currentSize = 0;
  private ttl: number;
  private onEvict?: (key: string, value: any) => void;

  constructor({ maxSize = 100 * 1024 * 1024, ttl = 5 * 60 * 1000, onEvict }: CacheManagerProps = {}) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.onEvict = onEvict;
  }

  private calculateSize(value: any): number {
    // Simple size calculation - in production, use proper serialization
    return JSON.stringify(value).length;
  }

  set(key: string, value: any): void {
    const size = this.calculateSize(value);
    const timestamp = Date.now();

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
      this.cache.delete(key);
    }

    // Evict items if necessary
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    this.cache.set(key, { value, timestamp, size });
    this.currentSize += size;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.onEvict?.(key, entry.value);
      return true;
    }
    return false;
  }

  clear(): void {
    for (const [key, entry] of this.cache) {
      this.onEvict?.(key, entry.value);
    }
    this.cache.clear();
    this.currentSize = 0;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.currentSize -= entry.size;
      this.onEvict?.(oldestKey, entry.value);
    }
  }

  getStats(): { size: number; count: number; hitRate: number } {
    return {
      size: this.currentSize,
      count: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

// Hook for using cache manager
export const useCacheManager = (config?: CacheManagerProps) => {
  const cacheManager = useRef(new CacheManager(config));
  
  return {
    cache: cacheManager.current,
    set: (key: string, value: any) => cacheManager.current.set(key, value),
    get: (key: string) => cacheManager.current.get(key),
    has: (key: string) => cacheManager.current.has(key),
    delete: (key: string) => cacheManager.current.delete(key),
    clear: () => cacheManager.current.clear(),
    getStats: () => cacheManager.current.getStats(),
  };
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  imageErrorContainer: {
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageErrorText: {
    fontSize: 12,
    color: '#999',
  },
});

export default {
  OptimizedFlatList,
  OptimizedImage,
  PerformanceMonitor,
  MemoryManager,
  NetworkManager,
  BatchProcessor,
  LazyLoad,
  CacheManager,
  useCacheManager,
};

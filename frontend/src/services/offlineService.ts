/**
 * Offline Service for PyMastery
 * Provides offline functionality including caching, sync, and offline detection
 */

interface CacheItem {
  data: unknown;
  timestamp: number;
  expiresAt?: number;
  etag?: string;
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: unknown;
  timestamp: number;
  retries: number;
}

interface OfflineConfig {
  cacheName: string;
  maxCacheSize: number;
  maxCacheAge: number;
  syncInterval: number;
  maxRetries: number;
}

class OfflineService {
  private cache: Map<string, CacheItem> = new Map();
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private config: OfflineConfig;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      cacheName: 'pymastery-cache',
      maxCacheSize: 100, // MB
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      syncInterval: 30 * 1000, // 30 seconds
      maxRetries: 3,
      ...config
    };

    this.initializeEventListeners();
    this.initializeCache();
    this.startSyncTimer();
  }

  private initializeEventListeners(): void {
    // Network status listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineChanges();
      this.notifyStatusChange('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange('offline');
    });

    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          this.invalidateCache(event.data.url);
        }
      });
    }
  }

  private async initializeCache(): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(this.config.cacheName);
        const keys = await cache.keys();
        
        // Clean expired cache entries
        const now = Date.now();
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const cached = response.headers.get('x-cached-at');
            if (cached) {
              const cacheTime = parseInt(cached);
              if (now - cacheTime > this.config.maxCacheAge) {
                await cache.delete(request);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to initialize cache:', error);
    }
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncOfflineChanges();
      }
    }, this.config.syncInterval);
  }

  private notifyStatusChange(status: 'online' | 'offline'): void {
    const event = new CustomEvent('offlineStatusChange', {
      detail: { status, isOnline: this.isOnline }
    });
    window.dispatchEvent(event);
  }

  // Cache management
  async get(key: string): Promise<unknown | null> {
    try {
      // Check memory cache first
      const memoryItem = this.cache.get(key);
      if (memoryItem) {
        if (memoryItem.expiresAt && Date.now() > memoryItem.expiresAt) {
          this.cache.delete(key);
          return null;
        }
        return memoryItem.data;
      }

      // Check browser cache
      if ('caches' in window) {
        const cache = await caches.open(this.config.cacheName);
        const response = await cache.match(key);
        
        if (response) {
          const cached = response.headers.get('x-cached-at');
          if (cached) {
            const cacheTime = parseInt(cached);
            if (Date.now() - cacheTime > this.config.maxCacheAge) {
              await cache.delete(key);
              return null;
            }
          }
          
          const data = await response.json();
          
          // Store in memory cache
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.config.maxCacheAge
          });
          
          return data;
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to get from cache:', error);
      return null;
    }
  }

  async set(key: string, data: unknown, options: { expiresAt?: number; etag?: string } = {}): Promise<void> {
    try {
      const cacheItem: CacheItem = {
        data,
        timestamp: Date.now(),
        expiresAt: options.expiresAt || Date.now() + this.config.maxCacheAge,
        etag: options.etag
      };

      // Store in memory cache
      this.cache.set(key, cacheItem);

      // Store in browser cache
      if ('caches' in window) {
        const cache = await caches.open(this.config.cacheName);
        const response = new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'x-cached-at': cacheItem.timestamp.toString(),
            'x-expires-at': (cacheItem.expiresAt || '').toString(),
            ...(cacheItem.etag && { 'etag': cacheItem.etag })
          }
        });
        
        await cache.put(key, response);
      }

      // Clean up old cache entries
      await this.cleanupCache();
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  async invalidateCache(key?: string): Promise<void> {
    try {
      if (key) {
        this.cache.delete(key);
        
        if ('caches' in window) {
          const cache = await caches.open(this.config.cacheName);
          await cache.delete(key);
        }
      } else {
        // Clear all cache
        this.cache.clear();
        
        if ('caches' in window) {
          await caches.delete(this.config.cacheName);
        }
      }
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(this.config.cacheName);
        const keys = await cache.keys();
        
        // Remove oldest entries if cache is too large
        if (keys.length > this.config.maxCacheSize) {
          const sortedKeys = [...keys].sort((a, b) => {
            const aTime = parseInt(a.url.split('/').pop() || '0');
            const bTime = parseInt(b.url.split('/').pop() || '0');
            return aTime - bTime;
          });
          
          const keysToDelete = sortedKeys.slice(0, keys.length - this.config.maxCacheSize);
          await Promise.all(keysToDelete.map((key) => cache.delete(key)));
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  // Network operations with offline support
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (this.isOnline) {
      try {
        const response = await fetch(url, options);
        
        // Cache successful GET requests
        if (options.method === 'GET' || !options.method) {
          if (response.ok) {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            await this.set(url, data, {
              etag: clonedResponse.headers.get('etag') || undefined
            });
          }
        }
        
        return response;
      } catch (error) {
        // Fallback to cache if network fails
        console.warn('Network request failed, falling back to cache:', error);
        return this.getCachedResponse(url);
      }
    } else {
      // Offline - return cached response or error
      return this.getCachedResponse(url);
    }
  }

  private async getCachedResponse(url: string): Promise<Response> {
    const cachedData = await this.get(url);
    
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        statusText: 'OK (Cached)',
        headers: {
          'Content-Type': 'application/json',
          'x-cached': 'true'
        }
      });
    }

    throw new Error('No cached data available');
  }

  // Sync operations
  async addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const syncOperation: SyncOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      ...operation
    };

    this.syncQueue.push(syncOperation);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncOfflineChanges();
    }
  }

  async syncOfflineChanges(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const operationsToSync = [...this.syncQueue];
    
    for (const operation of operationsToSync) {
      try {
        await this.syncOperation(operation);
        
        // Remove successful operation from queue
        const index = this.syncQueue.findIndex(op => op.id === operation.id);
        if (index !== -1) {
          this.syncQueue.splice(index, 1);
        }
      } catch (error) {
        console.warn(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        operation.retries++;
        
        // Remove from queue if max retries exceeded
        if (operation.retries >= this.config.maxRetries) {
          const index = this.syncQueue.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            this.syncQueue.splice(index, 1);
          }
          
          // Notify about failed sync
          this.notifySyncFailure(operation);
        }
      }
    }
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    const { type, endpoint, data } = operation;

    switch (type) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        break;

      case 'update':
        await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        break;

      case 'delete':
        await fetch(endpoint, {
          method: 'DELETE'
        });
        break;

      default:
        throw new Error(`Unknown sync operation type: ${type}`);
    }
  }

  private notifySyncFailure(operation: SyncOperation): void {
    const event = new CustomEvent('syncFailure', {
      detail: { operation, error: 'Max retries exceeded' }
    });
    window.dispatchEvent(event);
  }

  // Offline detection and status
  isOffline(): boolean {
    return !this.isOnline;
  }

  getSyncQueueSize(): number {
    return this.syncQueue.length;
  }

  getPendingOperations(): SyncOperation[] {
    return [...this.syncQueue];
  }

  // PWA helpers
  async registerServiceWorker(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
        return true;
      }
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
    return false;
  }

  async unregisterServiceWorker(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.unregister();
        console.log('Service worker unregistered');
        return true;
      }
    } catch (error) {
      console.warn('Service worker unregistration failed:', error);
    }
    return false;
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.cache.clear();
    this.syncQueue = [];
  }
}

// Singleton instance
export const offlineService = new OfflineService();

// Export types
export type { CacheItem, SyncOperation, OfflineConfig };
export default OfflineService;

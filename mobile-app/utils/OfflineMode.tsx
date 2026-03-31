import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AsyncStorage,
  Alert,
  Platform,
  NetInfo,
  AppState,
} from 'react-native';
import { useResponsive } from '../utils/responsive';

export interface OfflineStorageConfig {
  maxSize?: number;
  ttl?: number;
  encryptionEnabled?: boolean;
  compressionEnabled?: boolean;
  syncOnConnect?: boolean;
}

export interface OfflineData {
  key: string;
  value: any;
  timestamp: number;
  ttl?: number;
  encrypted?: boolean;
  compressed?: boolean;
  metadata?: Record<string, any>;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries?: number;
  maxRetries?: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export class OfflineStorageManager {
  private config: OfflineStorageConfig;
  private storage: AsyncStorageStatic;
  private encryptionKey?: string;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = true;

  constructor(config: OfflineStorageConfig = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      encryptionEnabled: false,
      compressionEnabled: true,
      syncOnConnect: true,
      ...config,
    };
    this.storage = AsyncStorage;
  }

  async initialize(encryptionKey?: string): Promise<void> {
    this.encryptionKey = encryptionKey;
    
    // Load sync queue
    await this.loadSyncQueue();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Cleanup expired data
    await this.cleanupExpiredData();
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Trigger sync when coming back online
      if (wasOffline && this.isOnline && this.config.syncOnConnect) {
        this.processSyncQueue();
      }
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await this.storage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await this.storage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private async cleanupExpiredData(): Promise<void> {
    try {
      const keys = await this.storage.getAllKeys();
      const now = Date.now();
      
      for (const key of keys) {
        if (key.startsWith('offline_')) {
          const data = await this.getItem(key.replace('offline_', ''));
          if (data && data.ttl && now - data.timestamp > data.ttl) {
            await this.removeItem(key.replace('offline_', ''));
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.config.encryptionEnabled || !this.encryptionKey) {
      return data;
    }
    
    // Simple encryption - in production, use proper encryption
    try {
      // This is a placeholder - implement proper encryption
      return btoa(data + this.encryptionKey);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  private async decrypt(data: string): Promise<string> {
    if (!this.config.encryptionEnabled || !this.encryptionKey) {
      return data;
    }
    
    try {
      // This is a placeholder - implement proper decryption
      const decrypted = atob(data);
      return decrypted.replace(this.encryptionKey, '');
    } catch (error) {
      console.error('Decryption failed:', error);
      return data;
    }
  }

  private async compress(data: string): Promise<string> {
    if (!this.config.compressionEnabled) {
      return data;
    }
    
    try {
      // Simple compression - in production, use proper compression
      return JSON.stringify({ compressed: true, data: btoa(data) });
    } catch (error) {
      console.error('Compression failed:', error);
      return data;
    }
  }

  private async decompress(data: string): Promise<string> {
    try {
      const parsed = JSON.parse(data);
      if (parsed.compressed) {
        return atob(parsed.data);
      }
      return data;
    } catch (error) {
      return data; // Not compressed
    }
  }

  async setItem(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const timestamp = Date.now();
      const data: OfflineData = {
        key,
        value,
        timestamp,
        ttl: ttl || this.config.ttl,
        encrypted: this.config.encryptionEnabled,
        compressed: this.config.compressionEnabled,
      };

      let serializedData = JSON.stringify(data);
      
      // Compress if enabled
      if (this.config.compressionEnabled) {
        serializedData = await this.compress(serializedData);
      }
      
      // Encrypt if enabled
      if (this.config.encryptionEnabled) {
        serializedData = await this.encrypt(serializedData);
      }

      await this.storage.setItem(`offline_${key}`, serializedData);
    } catch (error) {
      console.error('Failed to set item:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<OfflineData | null> {
    try {
      let serializedData = await this.storage.getItem(`offline_${key}`);
      
      if (!serializedData) {
        return null;
      }

      // Decrypt if enabled
      if (this.config.encryptionEnabled) {
        serializedData = await this.decrypt(serializedData);
      }
      
      // Decompress if enabled
      if (this.config.compressionEnabled) {
        serializedData = await this.decompress(serializedData);
      }

      const data: OfflineData = JSON.parse(serializedData);
      
      // Check TTL
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        await this.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(`offline_${key}`);
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.storage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      
      await Promise.all(offlineKeys.map(key => this.storage.removeItem(key)));
      
      // Clear sync queue
      this.syncQueue = [];
      await this.saveSyncQueue();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  async getKeys(): Promise<string[]> {
    try {
      const keys = await this.storage.getAllKeys();
      return keys
        .filter(key => key.startsWith('offline_'))
        .map(key => key.replace('offline_', ''));
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  async getSize(): Promise<number> {
    try {
      const keys = await this.getKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const data = await this.getItem(key);
        if (data) {
          totalSize += JSON.stringify(data.value).length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get size:', error);
      return 0;
    }
  }

  addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status'>): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
      maxRetries: operation.maxRetries || 3,
    };
    
    this.syncQueue.push(syncOp);
    this.saveSyncQueue();
    
    // Process immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
    
    for (const operation of pendingOperations) {
      try {
        operation.status = 'syncing';
        await this.saveSyncQueue();
        
        // Execute the sync operation
        await this.executeSyncOperation(operation);
        
        operation.status = 'completed';
      } catch (error) {
        console.error('Sync operation failed:', error);
        operation.retries = (operation.retries || 0) + 1;
        
        if (operation.retries >= operation.maxRetries) {
          operation.status = 'failed';
        } else {
          operation.status = 'pending';
        }
      }
      
      await this.saveSyncQueue();
    }
    
    // Remove completed operations
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'completed');
    await this.saveSyncQueue();
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    // This would make actual API calls to sync with the server
    // For now, we'll simulate the sync
    console.log('Executing sync operation:', operation);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would make HTTP requests
    // based on the operation type and endpoint
  }

  getSyncQueueStatus(): {
    total: number;
    pending: number;
    syncing: number;
    completed: number;
    failed: number;
  } {
    const total = this.syncQueue.length;
    const pending = this.syncQueue.filter(op => op.status === 'pending').length;
    const syncing = this.syncQueue.filter(op => op.status === 'syncing').length;
    const completed = this.syncQueue.filter(op => op.status === 'completed').length;
    const failed = this.syncQueue.filter(op => op.status === 'failed').length;

    return { total, pending, syncing, completed, failed };
  }

  isConnectionAvailable(): boolean {
    return this.isOnline;
  }
}

export interface OfflineProviderProps {
  children: React.ReactNode;
  config?: OfflineStorageConfig;
  encryptionKey?: string;
  onSyncProgress?: (progress: number) => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
  config,
  encryptionKey,
  onSyncProgress,
  onSyncComplete,
  onSyncError,
}) => {
  const [storageManager] = useState(() => new OfflineStorageManager(config));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    total: 0,
    pending: 0,
    syncing: 0,
    completed: 0,
    failed: 0,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        await storageManager.initialize(encryptionKey);
        setIsInitialized(true);
        
        // Setup network monitoring
        NetInfo.addEventListener(state => {
          const online = state.isConnected ?? false;
          setIsOnline(online);
        });
        
        // Setup sync monitoring
        const monitorSync = setInterval(() => {
          const status = storageManager.getSyncQueueStatus();
          setSyncStatus(status);
          
          if (status.total > 0) {
            const progress = ((status.completed + status.failed) / status.total) * 100;
            onSyncProgress?.(progress);
            
            if (status.pending === 0 && status.syncing === 0) {
              onSyncComplete?.();
            }
          }
        }, 1000);
        
        return () => clearInterval(monitorSync);
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
        onSyncError?.(error as Error);
      }
    };

    initialize();
  }, [storageManager, encryptionKey, onSyncProgress, onSyncComplete, onSyncError]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing offline storage...</Text>
      </View>
    );
  }

  return (
    <OfflineContext.Provider
      value={{
        storageManager,
        isOnline,
        syncStatus,
        isInitialized,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export interface OfflineContextType {
  storageManager: OfflineStorageManager;
  isOnline: boolean;
  syncStatus: {
    total: number;
    pending: number;
    syncing: number;
    completed: number;
    failed: number;
  };
  isInitialized: boolean;
}

export const OfflineContext = React.createContext<OfflineContextType | null>(null);

export const useOffline = (): OfflineContextType => {
  const context = React.useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export interface OfflineIndicatorProps {
  style?: any;
  showSyncStatus?: boolean;
  showNetworkStatus?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  showSyncStatus = true,
  showNetworkStatus = true,
}) => {
  const { isOnline, syncStatus } = useOffline();
  const { isTablet } = useResponsive();

  if (isOnline && syncStatus.total === 0) {
    return null;
  }

  return (
    <View style={[styles.indicatorContainer, style]}>
      {!isOnline && showNetworkStatus && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline. Some features may be limited.</Text>
        </View>
      )}
      
      {isOnline && syncStatus.total > 0 && showSyncStatus && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            Syncing {syncStatus.pending + syncStatus.syncing} of {syncStatus.total} items...
          </Text>
        </View>
      )}
    </View>
  );
};

export interface OfflineCacheProps {
  key: string;
  data: any;
  ttl?: number;
  children: (data: any, isCached: boolean) => React.ReactNode;
  fallback?: React.ReactNode;
  style?: any;
}

export const OfflineCache: React.FC<OfflineCacheProps> = ({
  key,
  data,
  ttl,
  children,
  fallback,
  style,
}) => {
  const { storageManager, isOnline } = useOffline();
  const [cachedData, setCachedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Try to get from cache first
        const cached = await storageManager.getItem(key);
        
        if (cached) {
          setCachedData(cached.value);
          setIsCached(true);
        }
        
        // If online and no cache, store the data
        if (isOnline && !cached && data) {
          await storageManager.setItem(key, data, ttl);
          setCachedData(data);
          setIsCached(false);
        }
      } catch (error) {
        console.error('Failed to load cached data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, data, ttl, storageManager, isOnline]);

  if (isLoading) {
    return <View style={style}>{fallback}</View>;
  }

  if (!cachedData) {
    return <View style={style}>{fallback}</View>;
  }

  return <View style={style}>{children(cachedData, isCached)}</View>;
};

export interface OfflineSyncButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  showStatus?: boolean;
  style?: any;
}

export const OfflineSyncButton: React.FC<OfflineSyncButtonProps> = ({
  onPress,
  disabled = false,
  showStatus = true,
  style,
}) => {
  const { storageManager, isOnline, syncStatus } = useOffline();

  const handlePress = () => {
    if (isOnline) {
      storageManager.processSyncQueue();
    }
    onPress?.();
  };

  const hasPendingSync = syncStatus.total > 0;

  return (
    <View style={[styles.syncButtonContainer, style]}>
      {showStatus && (
        <View style={styles.syncStatus}>
          <Text style={styles.syncStatusText}>
            {hasPendingSync ? `${syncStatus.pending} pending` : 'All synced'}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.syncButton,
          !isOnline && styles.syncButtonDisabled,
          disabled && styles.syncButtonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || !isOnline}
      >
        <Text style={styles.syncButtonText}>
          {isOnline ? 'Sync Now' : 'Offline'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offlineBanner: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  syncBanner: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  syncText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  syncButtonContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  syncStatus: {
    marginBottom: 8,
  },
  syncStatusText: {
    fontSize: 12,
    color: '#666',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {
  OfflineStorageManager,
  OfflineProvider,
  useOffline,
  OfflineIndicator,
  OfflineCache,
  OfflineSyncButton,
};

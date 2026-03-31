/**
 * Offline hook for PyMastery
 * Provides offline detection, sync status, and offline functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  offlineService,
  type SyncOperation as OfflineSyncOperation,
} from '../services/offlineService';

interface NetworkInformation {
  effectiveType?: string;
  type?: string;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
};

interface OfflineStatusChangeDetail {
  isOnline: boolean;
}

interface SyncFailureDetail {
  error?: string;
}

type SyncOperationInput = Omit<OfflineSyncOperation, 'id' | 'timestamp' | 'retries'>;

const getConnectionType = (): string => {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  const connection =
    navigatorWithConnection.connection ||
    navigatorWithConnection.mozConnection ||
    navigatorWithConnection.webkitConnection;

  return connection?.effectiveType || connection?.type || 'unknown';
};

const getPendingSyncErrors = (pendingOperations: OfflineSyncOperation[]): string[] =>
  pendingOperations
    .filter((operation) => operation.retries >= 3)
    .map((operation) => `Failed to sync ${operation.type} operation`);

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  syncQueueSize: number;
  lastSyncTime: number | null;
  connectionType: string;
}

export interface SyncStatus {
  pending: number;
  inProgress: boolean;
  lastSync: number | null;
  errors: string[];
}

const createInitialStatus = (): OfflineStatus => ({
  isOnline: navigator.onLine,
  isOffline: !navigator.onLine,
  syncQueueSize: offlineService.getSyncQueueSize(),
  lastSyncTime: null,
  connectionType: getConnectionType(),
});

const createInitialSyncStatus = (): SyncStatus => {
  const pendingOperations = offlineService.getPendingOperations();
  const pending = pendingOperations.length;

  return {
    pending,
    inProgress: pending > 0 && navigator.onLine,
    lastSync: null,
    errors: getPendingSyncErrors(pendingOperations),
  };
};

export const useOffline = () => {
  const [status, setStatus] = useState<OfflineStatus>(createInitialStatus);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(createInitialSyncStatus);

  const updateStatus = useCallback((lastSyncTime?: number | null) => {
    const isOnline = navigator.onLine;
    const syncQueueSize = offlineService.getSyncQueueSize();
    const connectionType = getConnectionType();

    setStatus((previousStatus) => ({
      isOnline,
      isOffline: !isOnline,
      syncQueueSize,
      lastSyncTime:
        lastSyncTime === undefined ? previousStatus.lastSyncTime : lastSyncTime,
      connectionType,
    }));
  }, []);

  const updateSyncStatus = useCallback(() => {
    const queueSize = offlineService.getSyncQueueSize();
    const pendingOperations = offlineService.getPendingOperations();
    const isOnline = navigator.onLine;

    setSyncStatus((previousStatus) => ({
      pending: queueSize,
      inProgress: queueSize > 0 && isOnline,
      lastSync: previousStatus.lastSync,
      errors: getPendingSyncErrors(pendingOperations),
    }));

    updateStatus();
  }, [updateStatus]);

  // Initialize event listeners
  useEffect(() => {
    const handleOnline = () => {
      updateStatus();
      updateSyncStatus();
    };

    const handleOffline = () => {
      updateStatus();
    };

    const handleOfflineStatusChange = (event: Event) => {
      const { detail } = event as CustomEvent<OfflineStatusChangeDetail>;

      setStatus((previousStatus) => ({
        ...previousStatus,
        isOnline: detail.isOnline,
        isOffline: !detail.isOnline,
        syncQueueSize: offlineService.getSyncQueueSize(),
        connectionType: getConnectionType(),
      }));
    };

    const handleSyncFailure = (event: Event) => {
      const { detail } = event as CustomEvent<SyncFailureDetail>;
      const errorMessage = detail.error ?? 'Unknown sync error';

      setSyncStatus((previousStatus) => ({
        ...previousStatus,
        pending: offlineService.getSyncQueueSize(),
        inProgress: false,
        errors: [...previousStatus.errors, `Sync failed: ${errorMessage}`],
      }));

      updateStatus();
    };

    const handleBackgroundSync = () => {
      const syncTime = Date.now();

      setSyncStatus((previousStatus) => ({
        ...previousStatus,
        pending: offlineService.getSyncQueueSize(),
        lastSync: syncTime,
        inProgress: false,
        errors: getPendingSyncErrors(offlineService.getPendingOperations()),
      }));

      updateStatus(syncTime);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offlineStatusChange', handleOfflineStatusChange as EventListener);
    window.addEventListener('syncFailure', handleSyncFailure as EventListener);
    window.addEventListener('BACKGROUND_SYNC', handleBackgroundSync as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineStatusChange', handleOfflineStatusChange as EventListener);
      window.removeEventListener('syncFailure', handleSyncFailure as EventListener);
      window.removeEventListener('BACKGROUND_SYNC', handleBackgroundSync as EventListener);
    };
  }, [updateStatus, updateSyncStatus]);

  // Periodic sync status update
  useEffect(() => {
    const interval = setInterval(() => {
      updateSyncStatus();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (status.isOnline) {
      setSyncStatus((previousStatus) => ({ ...previousStatus, inProgress: true }));

      try {
        await offlineService.syncOfflineChanges();
        const syncTime = Date.now();

        setSyncStatus((previousStatus) => ({
          ...previousStatus,
          pending: offlineService.getSyncQueueSize(),
          inProgress: false,
          lastSync: syncTime,
          errors: getPendingSyncErrors(offlineService.getPendingOperations()),
        }));

        updateStatus(syncTime);
      } catch (_error) {
        setSyncStatus((previousStatus) => ({
          ...previousStatus,
          inProgress: false,
          errors: [...previousStatus.errors, 'Manual sync failed'],
        }));
      }
    }
  }, [status.isOnline, updateStatus]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await offlineService.invalidateCache();
      setSyncStatus((previousStatus) => ({
        ...previousStatus,
        errors: [],
        pending: 0,
        inProgress: false,
      }));

      updateStatus();
    } catch (_error) {
      setSyncStatus((previousStatus) => ({
        ...previousStatus,
        errors: [...previousStatus.errors, 'Failed to clear cache'],
      }));
    }
  }, [updateStatus]);

  // Get cached data
  const getCachedData = useCallback(async (key: string): Promise<unknown | null> => {
    try {
      return await offlineService.get(key);
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }, []);

  // Set cached data
  const setCachedData = useCallback(async (
    key: string,
    data: unknown,
    options?: { expiresAt?: number; etag?: string }
  ): Promise<void> => {
    try {
      await offlineService.set(key, data, options);
    } catch (error) {
      console.warn('Failed to set cached data:', error);
    }
  }, []);

  // Add to sync queue
  const addToSyncQueue = useCallback(async (operation: SyncOperationInput): Promise<void> => {
    try {
      await offlineService.addToSyncQueue(operation);
      updateSyncStatus();
    } catch (error) {
      console.warn('Failed to add to sync queue:', error);
    }
  }, [updateSyncStatus]);

  return {
    status,
    syncStatus,
    triggerSync,
    clearCache,
    getCachedData,
    setCachedData,
    addToSyncQueue,
    isOnline: status.isOnline,
    isOffline: status.isOffline,
    hasPendingSync: syncStatus.pending > 0,
    connectionType: status.connectionType
  };
};

export default useOffline;

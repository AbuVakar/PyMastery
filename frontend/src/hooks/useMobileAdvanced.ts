import { useState, useEffect, useCallback } from 'react';

interface MobileCapabilities {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  hasCamera: boolean;
  hasGeolocation: boolean;
  hasVibration: boolean;
  hasNotification: boolean;
  hasBiometric: boolean;
  networkStatus: 'online' | 'offline' | 'slow';
  batteryLevel?: number;
  isCharging?: boolean;
}

interface AdvancedMobileFeatures {
  // Camera features
  capturePhoto: () => Promise<string>;
  scanQRCode: () => Promise<string>;
  
  // Geolocation features
  getCurrentLocation: () => Promise<GeolocationPosition>;
  watchLocation: (callback: (position: GeolocationPosition) => void) => () => void;
  
  // Notification features
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendPushNotification: (title: string, body: string) => Promise<void>;
  
  // Biometric features
  authenticateWithBiometrics: () => Promise<boolean>;
  
  // Offline features
  syncOfflineData: () => Promise<void>;
  cacheForOffline: (data: Record<string, unknown>) => Promise<void>;
  
  // Performance features
  optimizeForDevice: () => void;
  getDevicePerformance: () => 'low' | 'medium' | 'high';
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
  deviceMemory?: number;
};

export const useMobileAdvanced = (): MobileCapabilities & AdvancedMobileFeatures => {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>({
    isNative: false, // Simplified - would need proper detection
    platform: 'web', // Default to web
    hasCamera: false,
    hasGeolocation: false,
    hasVibration: false,
    hasNotification: false,
    hasBiometric: false,
    networkStatus: 'online'
  });

  const [batteryLevel, setBatteryLevel] = useState<number>();
  const [isCharging, setIsCharging] = useState<boolean>();

  // Check device capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      const caps: MobileCapabilities = {
        isNative: false,
        platform: 'web',
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasGeolocation: 'geolocation' in navigator,
        hasVibration: 'vibrate' in navigator,
        hasNotification: 'Notification' in window,
        hasBiometric: 'credentials' in navigator,
        networkStatus: navigator.onLine ? 'online' : 'offline',
      };

      setCapabilities(caps);
    };

    checkCapabilities();

    // Monitor network status
    const handleOnline = () => setCapabilities(prev => ({ ...prev, networkStatus: 'online' }));
    const handleOffline = () => setCapabilities(prev => ({ ...prev, networkStatus: 'offline' }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery if available
  useEffect(() => {
    const navWithBattery = navigator as NavigatorWithBattery;
    let currentBattery: BatteryManager | null = null;
    let isMounted = true;

    const handleLevelChange = () => {
      if (currentBattery && isMounted) {
        setBatteryLevel(currentBattery.level * 100);
      }
    };

    const handleChargingChange = () => {
      if (currentBattery && isMounted) {
        setIsCharging(currentBattery.charging);
      }
    };

    if (navWithBattery.getBattery) {
      void navWithBattery.getBattery().then((battery) => {
        if (!isMounted) {
          return;
        }

        currentBattery = battery;
        setBatteryLevel(battery.level * 100);
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', handleLevelChange);
        battery.addEventListener('chargingchange', handleChargingChange);
      });
    }

    return () => {
      isMounted = false;
      currentBattery?.removeEventListener('levelchange', handleLevelChange);
      currentBattery?.removeEventListener('chargingchange', handleChargingChange);
    };
  }, []);

  // Camera features
  const capturePhoto = useCallback(async (): Promise<string> => {
    if (!capabilities.hasCamera) {
      throw new Error('Camera not available');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      // Create canvas to capture image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      
      // Stop stream
      stream.getTracks().forEach(track => track.stop());
      
      // Return image data
      return canvas.toDataURL('image/jpeg');
    } catch (error) {
      throw new Error(`Camera capture failed: ${error}`);
    }
  }, [capabilities.hasCamera]);

  const scanQRCode = useCallback(async (): Promise<string> => {
    // Simplified QR code scanning - in production, use a library like qr-scanner
    await capturePhoto();
    
    // This would integrate with a QR code scanning library
    // For now, return a placeholder
    return 'QR_CODE_RESULT_PLACEHOLDER';
  }, [capturePhoto]);

  // Geolocation features
  const getCurrentLocation = useCallback(async (): Promise<GeolocationPosition> => {
    if (!capabilities.hasGeolocation) {
      throw new Error('Geolocation not available');
    }
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, [capabilities.hasGeolocation]);

  const watchLocation = useCallback((callback: (position: GeolocationPosition) => void) => {
    if (!capabilities.hasGeolocation) {
      throw new Error('Geolocation not available');
    }
    
    const watchId = navigator.geolocation.watchPosition(
      callback,
      error => console.error('Location watch error:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [capabilities.hasGeolocation]);

  // Notification features
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!capabilities.hasNotification) {
      throw new Error('Notifications not available');
    }
    
    return await Notification.requestPermission();
  }, [capabilities.hasNotification]);

  const sendPushNotification = useCallback(async (title: string, body: string) => {
    if (!capabilities.hasNotification) {
      throw new Error('Notifications not available');
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    
    new Notification(title, {
      body,
      icon: '/static/icons/icon-192x192.png',
      badge: '/static/icons/icon-72x72.png',
      tag: 'pymastery-notification'
    });
  }, [capabilities.hasNotification]);

  // Biometric features (simplified)
  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!capabilities.hasBiometric) {
      return false; // Graceful fallback
    }
    
    try {
      // Use WebAuthn API for biometric authentication
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [],
          userVerification: 'required'
        }
      });
      
      return !!credential;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, [capabilities.hasBiometric]);

  // Offline features
  const syncOfflineData = useCallback(async (): Promise<void> => {
    // Implement offline data sync logic
    const offlineData = localStorage.getItem('offlineData');
    if (offlineData && capabilities.networkStatus === 'online') {
      try {
        const data = JSON.parse(offlineData);
        // Sync with server
        await fetch('/api/sync/offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        localStorage.removeItem('offlineData');
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }, [capabilities.networkStatus]);

  const cacheForOffline = useCallback(async (data: Record<string, unknown>): Promise<void> => {
    const existingData = localStorage.getItem('offlineData') || '{}';
    const parsedData = JSON.parse(existingData) as Record<string, unknown>;
    const updatedData = { ...parsedData, ...data, timestamp: Date.now() };
    localStorage.setItem('offlineData', JSON.stringify(updatedData));
  }, []);

  // Performance features
  const getDevicePerformance = useCallback((): 'low' | 'medium' | 'high' => {
    // Simple performance detection based on memory and cores
    const memory = (navigator as NavigatorWithBattery).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (memory < 2 || cores < 2) return 'low';
    if (memory < 4 || cores < 4) return 'medium';
    return 'high';
  }, []);

  const optimizeForDevice = useCallback(() => {
    const performance = getDevicePerformance();
    
    switch (performance) {
      case 'low':
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
        document.documentElement.classList.add('low-performance-mode');
        break;
      case 'medium':
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
        break;
      case 'high':
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
        break;
    }
  }, [getDevicePerformance]);

  return {
    ...capabilities,
    batteryLevel,
    isCharging,
    capturePhoto,
    scanQRCode,
    getCurrentLocation,
    watchLocation,
    requestNotificationPermission,
    sendPushNotification,
    authenticateWithBiometrics,
    syncOfflineData,
    cacheForOffline,
    optimizeForDevice,
    getDevicePerformance
  };
};

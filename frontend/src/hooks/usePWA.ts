import { useCallback, useEffect, useState } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type CacheStats = Record<string, unknown>;

interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  installPrompt: PWAInstallPrompt | null;
  canInstall: boolean;
  needsUpdate: boolean;
  updateAvailable: boolean;
}

export const usePWA = () => {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    hasServiceWorker: false,
    serviceWorkerRegistration: null,
    installPrompt: null,
    canInstall: false,
    needsUpdate: false,
    updateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const checkStandalone = useCallback(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      setStatus((previousStatus) => ({
        ...previousStatus,
        hasServiceWorker: true,
        serviceWorkerRegistration: registration,
      }));

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) {
          return;
        }

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setStatus((previousStatus) => ({
              ...previousStatus,
              updateAvailable: true,
            }));
          }
        });
      });

      return registration;
    } catch (error: unknown) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setStatus((previousStatus) => ({
          ...previousStatus,
          isInstalled: true,
          canInstall: false,
        }));
        return true;
      }

      console.log('PWA installation dismissed');
      return false;
    } catch (error: unknown) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  const updateServiceWorker = useCallback(async () => {
    if (!status.serviceWorkerRegistration) {
      return false;
    }

    try {
      await status.serviceWorkerRegistration.update();
      return true;
    } catch (error: unknown) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  }, [status.serviceWorkerRegistration]);

  const skipWaiting = useCallback(() => {
    if (!status.serviceWorkerRegistration?.waiting) {
      return false;
    }

    status.serviceWorkerRegistration.waiting.postMessage({
      type: 'SKIP_WAITING',
    });
    return true;
  }, [status.serviceWorkerRegistration]);

  const getServiceWorkerVersion = useCallback(async (): Promise<string | null> => {
    if (!status.serviceWorkerRegistration) {
      return null;
    }

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (
          event: MessageEvent<{ version?: string }>
        ) => {
          resolve(typeof event.data.version === 'string' ? event.data.version : null);
        };

        status.serviceWorkerRegistration?.active?.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );

        setTimeout(() => resolve(null), 5000);
      });
    } catch (error: unknown) {
      console.error('Failed to get service worker version:', error);
      return null;
    }
  }, [status.serviceWorkerRegistration]);

  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!status.serviceWorkerRegistration) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (
          event: MessageEvent<{ status?: string }>
        ) => {
          resolve(event.data.status === 'success');
        };

        status.serviceWorkerRegistration?.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );

        setTimeout(() => resolve(false), 10000);
      });
    } catch (error: unknown) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, [status.serviceWorkerRegistration]);

  const getCacheStats = useCallback(async (): Promise<CacheStats | null> => {
    if (!status.serviceWorkerRegistration) {
      return null;
    }

    try {
      const messageChannel = new MessageChannel();

      return new Promise<CacheStats | null>((resolve) => {
        messageChannel.port1.onmessage = (
          event: MessageEvent<CacheStats | null>
        ) => {
          resolve(event.data);
        };

        status.serviceWorkerRegistration?.active?.postMessage(
          { type: 'GET_CACHE_STATS' },
          [messageChannel.port2]
        );

        setTimeout(() => resolve(null), 5000);
      });
    } catch (error: unknown) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }, [status.serviceWorkerRegistration]);

  const syncNow = useCallback(async (): Promise<boolean> => {
    if (!status.serviceWorkerRegistration) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (
          event: MessageEvent<{ status?: string }>
        ) => {
          resolve(event.data.status === 'synced');
        };

        status.serviceWorkerRegistration?.active?.postMessage(
          { type: 'SYNC_NOW' },
          [messageChannel.port2]
        );

        setTimeout(() => resolve(false), 30000);
      });
    } catch (error: unknown) {
      console.error('Failed to sync:', error);
      return false;
    }
  }, [status.serviceWorkerRegistration]);

  const canInstallPWA = useCallback(() => {
    return !status.isInstalled && !status.isStandalone && !!deferredPrompt;
  }, [status.isInstalled, status.isStandalone, deferredPrompt]);

  const getInstallInstructions = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) {
      return {
        browser: 'Chrome',
        steps: [
          'Click the three dots menu in the top-right corner',
          'Select "Install PyMastery"',
          'Click "Install" in the dialog',
        ],
      };
    }

    if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Click the three lines menu in the top-right corner',
          'Select "Install PyMastery"',
          'Click "Install" in the dialog',
        ],
      };
    }

    if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Click the Share button in the toolbar',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the dialog',
        ],
      };
    }

    return {
      browser: 'Unknown',
      steps: [
        'Look for an "Install" or "Add to Home Screen" option in your browser menu',
        'Follow the prompts to install the app',
      ],
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      setStatus((previousStatus) => ({
        ...previousStatus,
        canInstall: true,
        installPrompt: {
          prompt: () => promptEvent.prompt(),
          userChoice: promptEvent.userChoice,
        },
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);

      setStatus((previousStatus) => ({
        ...previousStatus,
        isInstalled: true,
        canInstall: false,
        installPrompt: null,
      }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((previousStatus) => ({ ...previousStatus, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((previousStatus) => ({ ...previousStatus, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const initializePWA = async () => {
      const isStandalone = checkStandalone();
      await registerServiceWorker();

      setStatus((previousStatus) => ({
        ...previousStatus,
        isStandalone,
        isInstalled: isStandalone,
      }));
    };

    void initializePWA();
  }, [checkStandalone, registerServiceWorker]);

  return {
    ...status,
    installPWA,
    updateServiceWorker,
    skipWaiting,
    getServiceWorkerVersion,
    clearCache,
    getCacheStats,
    syncNow,
    canInstallPWA,
    getInstallInstructions,
  };
};

export default usePWA;

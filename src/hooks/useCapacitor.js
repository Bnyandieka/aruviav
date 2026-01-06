// src/hooks/useCapacitor.js
import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';

/**
 * Hook to detect if app is running on mobile (via Capacitor)
 */
export const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = async () => {
      try {
        const appInfo = await App.getInfo();
        setIsMobile(!!appInfo);
      } catch {
        setIsMobile(false);
      }
    };
    
    checkMobile();
  }, []);

  return isMobile;
};

/**
 * Hook to check network status
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState('unknown');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setNetworkType(status.connectionType);
      } catch {
        setIsOnline(navigator.onLine);
      }
    };

    checkStatus();

    // Listen for network changes
    const listener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
      setNetworkType(status.connectionType);
    });

    // Fallback for web
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      listener?.remove();
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  return { isOnline, networkType };
};

/**
 * Hook for local storage using Capacitor Preferences
 */
export const useLocalStorage = (key, initialValue = null) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStoredValue = async () => {
      try {
        const { value } = await Preferences.get({ key });
        if (value) {
          setStoredValue(JSON.parse(value));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error reading preference:', error);
        setLoading(false);
      }
    };

    getStoredValue();
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = typeof value === 'function' ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await Preferences.set({
        key,
        value: JSON.stringify(valueToStore)
      });
    } catch (error) {
      console.error('Error setting preference:', error);
    }
  };

  const removeValue = async () => {
    try {
      setStoredValue(null);
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Error removing preference:', error);
    }
  };

  return [storedValue, setValue, removeValue, loading];
};

/**
 * Hook for sharing content on mobile
 */
export const useShare = () => {
  const share = async (options) => {
    try {
      await Share.share({
        title: options.title || 'Aruviah',
        text: options.text || '',
        url: options.url || window.location.href,
        dialogTitle: options.dialogTitle || 'Share'
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to native share or alert
      alert(`Share: ${options.title}\n${options.text}`);
    }
  };

  return { share };
};

/**
 * Hook to handle app lifecycle events
 */
export const useAppLifecycle = (callbacks = {}) => {
  useEffect(() => {
    const unsubscribeAppStateChange = App.addListener(
      'appStateChange',
      (state) => {
        if (state.isActive) {
          callbacks.onResume?.();
        } else {
          callbacks.onPause?.();
        }
      }
    );

    const unsubscribeBackButton = App.addListener('backButton', () => {
      callbacks.onBackPressed?.();
    });

    return () => {
      unsubscribeAppStateChange?.remove();
      unsubscribeBackButton?.remove();
    };
  }, [callbacks]);
};

/**
 * Hook to get device information
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const info = await App.getInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error('Error getting device info:', error);
      }
    };

    getDeviceInfo();
  }, []);

  return deviceInfo;
};

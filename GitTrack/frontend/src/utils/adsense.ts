import type { AdSenseConfig } from '../types/adsense'

export const getAdSenseConfig = (): AdSenseConfig => {
  return {
    clientId: import.meta.env.VITE_ADSENSE_CLIENT_ID || '',
    enabled: import.meta.env.NODE_ENV === 'production' && !!import.meta.env.VITE_ADSENSE_CLIENT_ID,
  };
};

export const isAdSenseEnabled = (): boolean => {
  const config = getAdSenseConfig();
  return config.enabled && config.clientId.length > 0;
};

export const loadAdSenseScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const config = getAdSenseConfig();
    
    if (!config.enabled) {
      resolve();
      return;
    }

    // 이미 로드된 경우
    if (document.querySelector(`script[src*="googlesyndication.com"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AdSense script'));
    
    document.head.appendChild(script);
  });
};

export const refreshAllAds = (): void => {
  if (typeof window !== 'undefined' && window.adsbygoogle) {
    const ads = document.querySelectorAll('.adsbygoogle');
    ads.forEach(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('Error refreshing ad:', error);
      }
    });
  }
};
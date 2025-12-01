import React, { createContext, useContext, useState, useEffect } from 'react';

const AdContext = createContext();

export const useAds = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};

export const AdProvider = ({ children }) => {
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [adConfig, setAdConfig] = useState({
    // Google AdSense (if using)
    googleAdSenseClientId: process.env.REACT_APP_ADSENSE_CLIENT_ID || '',
    
    // Custom ad network settings
    bannerAdNetwork: 'custom', // 'adsense' | 'custom'
    nativeAdNetwork: 'custom',
    popUnderAdNetwork: 'custom',
    
    // Ad frequency settings
    bannerFrequency: 'always', // 'always' | 'once-per-session' | 'once-per-page'
    nativeAdFrequency: 3, // Show native ad after every N videos
    popUnderFrequency: 'once-per-session', // 'once-per-session' | 'once-per-day' | 'on-video-play'
    
    // Ad positions
    bannerPositions: ['top', 'bottom', 'sidebar'],
    nativeAdPositions: ['video-list', 'sidebar'],
    
    // Pop-under settings
    popUnderEnabled: true,
    popUnderDelay: 5000, // milliseconds before showing pop-under
    popUnderTriggers: ['video-play', 'page-load'], // when to trigger
    
    // Smartlink ad settings
    smartlinkEnabled: true,
    smartlinkUrl: 'https://www.effectivegatecpm.com/b467swwk68?key=83daee009e4befaeaba7c9dea1c856e8',
    smartlinkFrequency: 'once-per-video', // 'once-per-video' | 'once-per-session' | 'always'
    
    // Custom ad codes (for custom ad networks)
    // 728x90 Banner Ad Key: f3d1a518f166a74bea90e44208c34ab0
    // 300x250 Sidebar Ad Key: 7a12bf219eb0e1cf100dc7b56654f792 (until new sidebar ad is provided)
    customBannerAds: {
      top: `<script type="text/javascript">
	atOptions = {
		'key' : 'f3d1a518f166a74bea90e44208c34ab0',
		'format' : 'iframe',
		'height' : 90,
		'width' : 728,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/f3d1a518f166a74bea90e44208c34ab0/invoke.js"></script>`,
      bottom: `<script type="text/javascript">
	atOptions = {
		'key' : 'f3d1a518f166a74bea90e44208c34ab0',
		'format' : 'iframe',
		'height' : 90,
		'width' : 728,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/f3d1a518f166a74bea90e44208c34ab0/invoke.js"></script>`,
      sidebar: `<script type="text/javascript">
	atOptions = {
		'key' : '7a12bf219eb0e1cf100dc7b56654f792',
		'format' : 'iframe',
		'height' : 250,
		'width' : 300,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/7a12bf219eb0e1cf100dc7b56654f792/invoke.js"></script>`
    },
    customNativeAds: [],
    customPopUnderAd: ''
  });

  // Track ad impressions
  const [adImpressions, setAdImpressions] = useState({
    banners: {},
    natives: {},
    popUnder: false
  });

  // Check if ad should be shown based on frequency
  const shouldShowAd = (adType, position = null) => {
    if (!adsEnabled) return false;

    switch (adType) {
      case 'banner':
        if (adConfig.bannerFrequency === 'always') return true;
        if (adConfig.bannerFrequency === 'once-per-session') {
          return !adImpressions.banners[position || 'default'];
        }
        return true;

      case 'native':
        // Native ads shown based on content position
        return true;

      case 'popUnder':
        if (!adConfig.popUnderEnabled) return false;
        if (adConfig.popUnderFrequency === 'once-per-session') {
          return !adImpressions.popUnder;
        }
        return true;

      default:
        return false;
    }
  };

  // Mark ad as shown
  const markAdShown = (adType, position = null) => {
    setAdImpressions(prev => {
      const newImpressions = { ...prev };
      
      if (adType === 'banner') {
        newImpressions.banners[position || 'default'] = true;
      } else if (adType === 'native') {
        newImpressions.natives[position || 'default'] = true;
      } else if (adType === 'popUnder') {
        newImpressions.popUnder = true;
      }
      
      return newImpressions;
    });
  };

  // Reset ad impressions (for new session)
  const resetAdImpressions = () => {
    setAdImpressions({
      banners: {},
      natives: {},
      popUnder: false
    });
  };

  // Load Google AdSense script if enabled
  useEffect(() => {
    if (adConfig.googleAdSenseClientId && !window.adsbygoogle) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.googleAdSenseClientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [adConfig.googleAdSenseClientId]);

  const value = {
    adsEnabled,
    setAdsEnabled,
    adConfig,
    setAdConfig,
    shouldShowAd,
    markAdShown,
    resetAdImpressions,
    adImpressions
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
};


import React, { useEffect, useRef } from 'react';
import { useAds } from '../../context/AdContext';
import './BannerAd.css';

// Initialize window.atOptions globally to prevent undefined errors
if (typeof window !== 'undefined' && !window.atOptions) {
    window.atOptions = {};
}

const BannerAd = ({ position = 'top', size = 'responsive', className = '' }) => {
  const { shouldShowAd, markAdShown, adConfig, adsEnabled } = useAds();
  const adRef = useRef(null);
  const adShownRef = useRef(false);
  const containerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    if (!adsEnabled || adShownRef.current) return;

    if (shouldShowAd('banner', position)) {
      // Mark as shown
      markAdShown('banner', position);
      adShownRef.current = true;

      // Load Google AdSense if configured
      if (adConfig.bannerAdNetwork === 'adsense' && window.adsbygoogle && adRef.current && !adRef.current.dataset.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }
  }, [adsEnabled, position, shouldShowAd, markAdShown, adConfig]);

  // Load custom ad script
  useEffect(() => {
    if (adConfig.bannerAdNetwork === 'custom' && adConfig.customBannerAds[position] && containerRef.current && !adLoadedRef.current) {
      const adCode = adConfig.customBannerAds[position];
      
      // Check if ad code contains script tags
      if (adCode.includes('<script')) {
        // Create container ID - the ad script looks for containers with this pattern
        const adKey = '7a12bf219eb0e1cf100dc7b56654f792';
        const containerId = `container-${adKey}-${position}`;
        containerRef.current.id = containerId;

        // Set up ad options BEFORE loading the script
        // Ensure window.atOptions is always initialized
        if (typeof window !== 'undefined') {
          // Double check initialization (in case of race conditions)
          if (!window.atOptions) {
            window.atOptions = {};
          }
          try {
            window.atOptions[adKey] = {
              'key': adKey,
              'format': 'iframe',
              'height': 90,
              'width': 728,
              'params': {}
            };
          } catch (error) {
            console.error('Error setting atOptions in BannerAd:', error);
            // Re-initialize if there was an error
            window.atOptions = {};
            window.atOptions[adKey] = {
              'key': adKey,
              'format': 'iframe',
              'height': 90,
              'width': 728,
              'params': {}
            };
          }
        }

        // Extract and load script
        const scriptMatch = adCode.match(/src="([^"]+)"/);
        if (scriptMatch && scriptMatch[1]) {
          const scriptUrl = scriptMatch[1].startsWith('//') ? `https:${scriptMatch[1]}` : scriptMatch[1];
          
          // Check if script is already loaded globally
          const existingScript = document.querySelector(`script[src*="${adKey}/invoke.js"]`);
          
          if (!existingScript) {
            // Load script in document.head
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = scriptUrl;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
              console.log('BannerAd script loaded successfully');
            };
            
            script.onerror = (error) => {
              console.error('Failed to load BannerAd script:', error);
            };

            document.head.appendChild(script);
          } else {
            // Script already exists, ad should auto-inject
            console.log('BannerAd script already loaded');
          }
          
          adLoadedRef.current = true;
        }
      } else {
        // If no script tags, use innerHTML
        containerRef.current.innerHTML = adCode;
        adLoadedRef.current = true;
      }
    }
  }, [position, adConfig.bannerAdNetwork, adConfig.customBannerAds]);

  if (!adsEnabled || !shouldShowAd('banner', position)) {
    return null;
  }

  const getAdSize = () => {
    const sizes = {
      'responsive': 'auto',
      'leaderboard': '728x90',
      'banner': '468x60',
      'large-banner': '970x250',
      'medium-rectangle': '300x250',
      'wide-skyscraper': '160x600'
    };
    return sizes[size] || 'auto';
  };

  // Custom ad code
  if (adConfig.bannerAdNetwork === 'custom' && adConfig.customBannerAds[position]) {
    return (
      <div className={`banner-ad banner-ad-${position} ${className}`}>
        <div 
          ref={containerRef}
          className="banner-ad-content"
        />
      </div>
    );
  }

  // Google AdSense
  if (adConfig.bannerAdNetwork === 'adsense' && adConfig.googleAdSenseClientId) {
    return (
      <div className={`banner-ad banner-ad-${position} ${className}`}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adConfig.googleAdSenseClientId}
          data-ad-slot={adConfig.bannerAdSlots?.[position] || ''}
          data-ad-format={getAdSize() === 'auto' ? 'auto' : 'horizontal'}
          data-full-width-responsive={getAdSize() === 'auto' ? 'true' : 'false'}
        />
      </div>
    );
  }

  // Placeholder for development
  return (
    <div className={`banner-ad banner-ad-${position} banner-ad-placeholder ${className}`}>
      <div className="banner-ad-content">
        <span className="ad-label">Advertisement</span>
        <div className="ad-placeholder">
          {size === 'responsive' ? '728x90' : size} Banner Ad
          <br />
          <small>Configure ad network in AdContext</small>
        </div>
      </div>
    </div>
  );
};

export default BannerAd;


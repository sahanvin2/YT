import React, { useEffect, useRef } from 'react';
import { useAds } from '../../context/AdContext';
import './NativeAd.css';

const NativeAd = ({ 
  position = 'video-list', 
  index = 0, 
  className = '',
  style = {}
}) => {
  const { shouldShowAd, markAdShown, adConfig, adsEnabled } = useAds();
  const adRef = useRef(null);
  const adShownRef = useRef(false);

  useEffect(() => {
    if (!adsEnabled || adShownRef.current) return;

    // Show native ad at specified frequency (e.g., every 3rd video)
    const shouldShow = index > 0 && index % adConfig.nativeAdFrequency === 0;
    
    if (shouldShow && shouldShowAd('native', position)) {
      markAdShown('native', `${position}-${index}`);
      adShownRef.current = true;

      // Load Google AdSense if configured
      if (adConfig.nativeAdNetwork === 'adsense' && window.adsbygoogle && !adRef.current?.dataset?.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }
  }, [adsEnabled, position, index, shouldShowAd, markAdShown, adConfig]);

  // Check if this ad should be displayed
  const shouldDisplay = index > 0 && index % adConfig.nativeAdFrequency === 0;

  if (!adsEnabled || !shouldDisplay || !shouldShowAd('native', position)) {
    return null;
  }

  // Custom native ad
  if (adConfig.nativeAdNetwork === 'custom' && adConfig.customNativeAds.length > 0) {
    const adIndex = Math.floor(index / adConfig.nativeAdFrequency) % adConfig.customNativeAds.length;
    const ad = adConfig.customNativeAds[adIndex];
    
    if (ad) {
      return (
        <div className={`native-ad native-ad-${position} ${className}`} style={style}>
          <div className="native-ad-label">Sponsored</div>
          <div 
            className="native-ad-content"
            dangerouslySetInnerHTML={{ __html: ad }}
          />
        </div>
      );
    }
  }

  // Google AdSense native ad
  if (adConfig.nativeAdNetwork === 'adsense' && adConfig.googleAdSenseClientId) {
    return (
      <div className={`native-ad native-ad-${position} ${className}`} style={style}>
        <div className="native-ad-label">Advertisement</div>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-client={adConfig.googleAdSenseClientId}
          data-ad-slot={adConfig.nativeAdSlots?.[position] || ''}
          data-ad-format="fluid"
          data-layout="in-article"
        />
      </div>
    );
  }

  // Placeholder
  return (
    <div className={`native-ad native-ad-${position} native-ad-placeholder ${className}`} style={style}>
      <div className="native-ad-label">Sponsored</div>
      <div className="native-ad-content">
        <div className="native-ad-placeholder">
          <div className="native-ad-image"></div>
          <div className="native-ad-text">
            <div className="native-ad-title">Native Advertisement</div>
            <div className="native-ad-description">This is a native ad placeholder</div>
            <div className="native-ad-cta">Learn More</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NativeAd;


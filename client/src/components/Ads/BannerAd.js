import React, { useEffect, useRef } from 'react';
import { useAds } from '../../context/AdContext';
import './BannerAd.css';

const BannerAd = ({ position = 'top', size = 'responsive', className = '' }) => {
  const { shouldShowAd, markAdShown, adConfig, adsEnabled } = useAds();
  const adRef = useRef(null);
  const adShownRef = useRef(false);

  useEffect(() => {
    if (!adsEnabled || adShownRef.current) return;

    if (shouldShowAd('banner', position)) {
      // Mark as shown
      markAdShown('banner', position);
      adShownRef.current = true;

      // Load Google AdSense if configured
      if (adConfig.bannerAdNetwork === 'adsense' && window.adsbygoogle && !adRef.current.dataset.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }
  }, [adsEnabled, position, shouldShowAd, markAdShown, adConfig]);

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
          className="banner-ad-content"
          dangerouslySetInnerHTML={{ __html: adConfig.customBannerAds[position] }}
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


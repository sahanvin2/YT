import React, { useEffect, useRef } from 'react';
import { useAds } from '../../context/AdContext';
import './PopUnderAd.css';

const PopUnderAd = ({ trigger = 'video-play' }) => {
  const { shouldShowAd, markAdShown, adConfig, adsEnabled } = useAds();
  const popupRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!adsEnabled || !adConfig.popUnderEnabled || hasTriggeredRef.current) return;

    const triggerAd = () => {
      if (!shouldShowAd('popUnder')) return;

      // Delay before showing pop-under
      timeoutRef.current = setTimeout(() => {
        if (adConfig.popUnderAdNetwork === 'custom' && adConfig.customPopUnderAd) {
          // Open pop-under window
          const popup = window.open(
            '',
            '_blank',
            'width=1,height=1,left=-1000,top=-1000'
          );
          
          if (popup) {
            popup.document.write(adConfig.customPopUnderAd);
            popup.document.close();
            
            // Mark as shown
            markAdShown('popUnder');
            hasTriggeredRef.current = true;
          }
        } else if (adConfig.popUnderAdNetwork === 'adsense' && adConfig.googleAdSenseClientId) {
          // For AdSense, you'd typically use a different approach
          // This is a placeholder for custom implementation
          console.log('Pop-under ad triggered');
          markAdShown('popUnder');
          hasTriggeredRef.current = true;
        }
      }, adConfig.popUnderDelay);
    };

    // Listen for trigger events
    if (trigger === 'video-play') {
      // Listen for video play events
      const handleVideoPlay = () => {
        triggerAd();
      };

      // Check if video player exists
      const videoPlayers = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
      videoPlayers.forEach(player => {
        player.addEventListener('play', handleVideoPlay, { once: true });
      });

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        videoPlayers.forEach(player => {
          player.removeEventListener('play', handleVideoPlay);
        });
      };
    } else if (trigger === 'page-load') {
      // Trigger on page load
      triggerAd();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [adsEnabled, adConfig, shouldShowAd, markAdShown, trigger]);

  // This component doesn't render anything visible
  return null;
};

export default PopUnderAd;


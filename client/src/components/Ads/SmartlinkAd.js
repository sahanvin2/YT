import React, { useState, useEffect, useRef } from 'react';
import { useAds } from '../../context/AdContext';
import './SmartlinkAd.css';

const SmartlinkAd = ({ onAdClosed, onAdCompleted }) => {
  const { adConfig, adsEnabled, markAdShown } = useAds();
  const [showAd, setShowAd] = useState(false);
  const [adUrl, setAdUrl] = useState('');
  const adWindowRef = useRef(null);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!adsEnabled || !adConfig.smartlinkEnabled) return;

    // Get smartlink URL from config
    const smartlinkUrl = adConfig.smartlinkUrl || '';
    if (!smartlinkUrl) return;

    setAdUrl(smartlinkUrl);
  }, [adsEnabled, adConfig]);

  const openSmartlink = () => {
    if (!adUrl) return;

    // Open smartlink in new window/tab
    const adWindow = window.open(
      adUrl,
      '_blank',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );

    if (!adWindow) {
      // Popup blocked - try redirecting current window
      if (window.confirm('Please allow popups to view the advertisement. Click OK to continue.')) {
        window.location.href = adUrl;
        // After redirect, user will need to come back manually
        return;
      }
    }

    adWindowRef.current = adWindow;

    // Check if ad window is closed
    checkIntervalRef.current = setInterval(() => {
      if (adWindow.closed) {
        // Ad window closed - user can now play video
        clearInterval(checkIntervalRef.current);
        markAdShown('smartlink');
        if (onAdCompleted) onAdCompleted();
      }
    }, 500);

    // Timeout after 30 seconds - allow video to play anyway
    setTimeout(() => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (adWindow && !adWindow.closed) {
        adWindow.close();
      }
      markAdShown('smartlink');
      if (onAdCompleted) onAdCompleted();
    }, 30000);
  };

  const closeAd = () => {
    if (adWindowRef.current && !adWindowRef.current.closed) {
      adWindowRef.current.close();
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    markAdShown('smartlink');
    if (onAdClosed) onAdClosed();
    if (onAdCompleted) onAdCompleted();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (adWindowRef.current && !adWindowRef.current.closed) {
        adWindowRef.current.close();
      }
    };
  }, []);

  // Expose open function via ref (for parent components)
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    openSmartlink,
    closeAd
  }));

  return { openSmartlink, closeAd, showAd, setShowAd };
};

// Hook version for easier use
export const useSmartlinkAd = () => {
  const { adConfig, adsEnabled } = useAds();
  const [adShown, setAdShown] = useState(false);
  const adWindowRef = useRef(null);
  const checkIntervalRef = useRef(null);

  const openSmartlink = (callback) => {
    if (!adsEnabled || !adConfig.smartlinkEnabled || adShown) {
      if (callback) callback();
      return;
    }

    const smartlinkUrl = adConfig.smartlinkUrl || '';
    if (!smartlinkUrl) {
      if (callback) callback();
      return;
    }

    const adWindow = window.open(
      smartlinkUrl,
      '_blank',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );

    if (!adWindow) {
      // Popup blocked
      if (window.confirm('Please allow popups to view the advertisement.')) {
        window.location.href = smartlinkUrl;
      } else {
        if (callback) callback();
      }
      return;
    }

    adWindowRef.current = adWindow;
    setAdShown(true);

    // Check if window closed
    checkIntervalRef.current = setInterval(() => {
      if (adWindow.closed) {
        clearInterval(checkIntervalRef.current);
        setAdShown(false);
        if (callback) callback();
      }
    }, 500);

    // Timeout after 30 seconds
    setTimeout(() => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (adWindow && !adWindow.closed) {
        adWindow.close();
      }
      setAdShown(false);
      if (callback) callback();
    }, 30000);
  };

  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (adWindowRef.current && !adWindowRef.current.closed) {
        adWindowRef.current.close();
      }
    };
  }, []);

  return { openSmartlink, adShown };
};

export default SmartlinkAd;





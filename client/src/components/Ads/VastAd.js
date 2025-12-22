import React, { useEffect, useRef, useState } from 'react';
import { useAds } from '../../context/AdContext';
import './VastAd.css';

export const VastAd = ({ onAdComplete, onAdSkip, onAdError }) => {
  const { adConfig } = useAds();
  const videoRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [skipAvailable, setSkipAvailable] = useState(false);
  const [skipTimer, setSkipTimer] = useState(adConfig.vastAdSkipDelay || 5);
  const [adDuration, setAdDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const loadingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!adConfig.vastAdEnabled || !adConfig.vastTagUrl) {
      if (onAdError) onAdError(new Error('VAST ad not configured'));
      return;
    }

    // Set loading timeout - if ad doesn't load in 10 seconds, skip it
    loadingTimeoutRef.current = setTimeout(() => {
      console.error('VAST ad loading timeout');
      setAdError(true);
      if (onAdError) onAdError(new Error('Ad loading timeout'));
    }, 10000);

    loadVastAd();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const loadVastAd = async () => {
    try {
      // Fetch VAST XML
      const response = await fetch(adConfig.vastTagUrl);
      const vastXml = await response.text();
      
      // Parse VAST XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(vastXml, 'text/xml');
      
      // Extract video URL from VAST
      const mediaFile = xmlDoc.querySelector('MediaFile');
      if (!mediaFile) {
        throw new Error('No media file found in VAST response');
      }

      const videoUrl = mediaFile.textContent.trim();
      
      console.log('VAST ad video URL:', videoUrl);
      
      // Load video
      if (videoRef.current) {
        const video = videoRef.current;
        video.src = videoUrl;
        
        // Wait for video to be ready, then play
        video.onloadeddata = () => {
          console.log('VAST ad video loaded, attempting to play');
          // Clear loading timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          
          setAdLoaded(true);
          
          // Try to play the video
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('VAST ad playing successfully');
                // Start skip timer after video starts playing
                const skipDelay = adConfig.vastAdSkipDelay || 5;
                setTimeout(() => {
                  setSkipAvailable(true);
                }, skipDelay * 1000);
              })
              .catch(error => {
                console.error('Error playing VAST ad:', error);
                setAdError(true);
                if (onAdError) onAdError(error);
              });
          }
        };
        
        video.onerror = (e) => {
          console.error('Error loading VAST video:', e);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          setAdError(true);
          if (onAdError) onAdError(e);
        };
        
        video.load();
      }
    } catch (error) {
      console.error('Error loading VAST ad:', error);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setAdError(true);
      if (onAdError) onAdError(error);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setAdDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const remaining = Math.ceil(adConfig.vastAdSkipDelay - video.currentTime);
      if (remaining > 0 && remaining <= adConfig.vastAdSkipDelay) {
        setSkipTimer(remaining);
      }
    };

    const handleEnded = () => {
      if (onAdComplete) onAdComplete();
    };

    const handleError = (e) => {
      console.error('Video ad error:', e);
      setAdError(true);
      if (onAdError) onAdError(e);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [adConfig, onAdComplete, onAdError]);

  const handleSkip = () => {
    if (skipAvailable && onAdSkip) {
      onAdSkip();
    }
  };

  if (adError) {
    return null;
  }

  if (!adLoaded) {
    return (
      <div className="vast-ad-loading">
        <div className="vast-ad-spinner"></div>
        <p>Loading advertisement...</p>
      </div>
    );
  }

  return (
    <div className="vast-ad-container">
      <video
        ref={videoRef}
        className="vast-ad-video"
        playsInline
        muted={false}
        preload="auto"
      />
      
      <div className="vast-ad-overlay">
        <div className="vast-ad-info">
          <span className="vast-ad-label">Advertisement</span>
          {adDuration > 0 && (
            <span className="vast-ad-time">
              {Math.ceil(adDuration - currentTime)}s
            </span>
          )}
        </div>
        
        {skipAvailable ? (
          <button className="vast-ad-skip-button" onClick={handleSkip}>
            Skip Ad →
          </button>
        ) : (
          <div className="vast-ad-skip-timer">
            Skip in {skipTimer}s
          </div>
        )}
      </div>
      
      <div className="vast-ad-progress">
        <div 
          className="vast-ad-progress-bar"
          style={{ width: adDuration > 0 ? `${(currentTime / adDuration) * 100}%` : '0%' }}
        />
      </div>
    </div>
  );
};

export const useVastAd = () => {
  const { adConfig, markAdShown, shouldShowAd } = useAds();
  const [showVastAd, setShowVastAd] = useState(false);

  const openVastAd = () => {
    if (!adConfig.vastAdEnabled) {
      console.log('VAST ads are disabled');
      return false;
    }

    const shouldShow = shouldShowAd('vast');
    if (shouldShow) {
      setShowVastAd(true);
      markAdShown('vast');
      return true;
    }
    return false;
  };

  const closeVastAd = () => {
    setShowVastAd(false);
  };

  return { showVastAd, openVastAd, closeVastAd };
};

export default VastAd;

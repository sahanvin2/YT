import React, { useEffect, useMemo, useRef } from 'react';
import Hls from 'hls.js';

const HlsVideoPlayer = ({
  src,
  poster,
  playbackRate = 1,
  onPlay,
  onProgress,
  onError,
  onManifest,
  videoRefExternal,
  hlsRefExternal
}) => {
  const internalVideoRef = useRef(null);
  const internalHlsRef = useRef(null);

  const videoRef = videoRefExternal || internalVideoRef;
  const hlsRef = hlsRefExternal || internalHlsRef;

  const isHls = useMemo(() => typeof src === 'string' && src.includes('.m3u8'), [src]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.playbackRate = playbackRate || 1;
  }, [playbackRate, videoRef]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (typeof onProgress === 'function') {
        onProgress({ playedSeconds: videoEl.currentTime || 0 });
      }
    };

    const handlePlay = () => {
      if (typeof onPlay === 'function') onPlay();
    };

    const handleVideoError = () => {
      if (typeof onError === 'function') onError(new Error('HTML5 video error'));
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('error', handleVideoError);

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('error', handleVideoError);
    };
  }, [onError, onPlay, onProgress, videoRef]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Cleanup previous hls
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }

    if (!src) {
      videoEl.removeAttribute('src');
      try {
        videoEl.load();
      } catch {
        // ignore
      }
      return;
    }

    // If not HLS, just set src
    if (!isHls) {
      videoEl.src = src;
      return;
    }

    // Native HLS (Safari)
    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = src;
      if (typeof onManifest === 'function') {
        onManifest({ levels: [], hls: null });
      }
      return;
    }

    // hls.js
    if (!Hls.isSupported()) {
      videoEl.src = src;
      if (typeof onManifest === 'function') {
        onManifest({ levels: [], hls: null });
      }
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90
    });

    hlsRef.current = hls;

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data?.fatal) {
        if (typeof onError === 'function') onError(data);
        try {
          hls.destroy();
        } catch {
          // ignore
        }
        if (hlsRef.current === hls) hlsRef.current = null;
      }
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const levels = (hls.levels || [])
        .map((l, idx) => ({
          index: idx,
          height: l.height,
          bitrate: l.bitrate,
          name: l.height ? `${l.height}p` : `Level ${idx + 1}`
        }))
        .sort((a, b) => (b.height || 0) - (a.height || 0));

      if (typeof onManifest === 'function') {
        onManifest({ levels, hls });
      }
    });

    hls.loadSource(src);
    hls.attachMedia(videoEl);

    return () => {
      try {
        hls.destroy();
      } catch {
        // ignore
      }
      if (hlsRef.current === hls) hlsRef.current = null;
    };
  }, [isHls, onError, onManifest, src, videoRef, hlsRef]);

  return (
    <video
      ref={videoRef}
      className="native-video"
      controls
      playsInline
      preload="metadata"
      poster={poster}
      controlsList="nodownload noremoteplayback"
      crossOrigin="anonymous"
    />
  );
};

export default HlsVideoPlayer;

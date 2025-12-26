# Video Quality Selector - Implementation Status

## Current Status: ✅ IMPLEMENTED, 🔄 TESTING NEEDED

## Overview
The video player now has a quality selector for HLS streams that allows users to manually select video quality (360p, 240p, 144p) in addition to "Auto" adaptive streaming.

## Implementation Details

### Frontend Changes

#### 1. Watch.js State Management
Added state for managing HLS quality levels:
```javascript
const [hlsLevels, setHlsLevels] = useState([]);
const [currentQuality, setCurrentQuality] = useState('auto');
const [showQualityMenu, setShowQualityMenu] = useState(false);
```

#### 2. URL Normalization
Fixed video playback by converting proxy URLs to direct CDN URLs:
```javascript
const normalizePlaybackUrl = (inputUrl, userId, videoId) => {
  // Convert /api/hls/userId/videoId/file.m3u8 
  // to https://Xclub.b-cdn.net/videos/userId/videoId/file.m3u8
  
  const cdnBase = 'https://Xclub.b-cdn.net';
  const proxyMatch = inputUrl.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
  
  if (proxyMatch) {
    const [, uid, vid, file] = proxyMatch;
    return `${cdnBase}/videos/${uid}/${vid}/${file}`;
  }
  
  return inputUrl;
};
```

#### 3. HLS Level Detection (Enhanced)
Improved detection of available quality levels from HLS.js player:
```javascript
const onReady = (player) => {
  try {
    const internalPlayer = player.getInternalPlayer('hls');
    
    // Wait for HLS.js to fully initialize
    setTimeout(() => {
      if (internalPlayer && typeof internalPlayer.levels !== 'undefined') {
        const levels = internalPlayer.levels || [];
        
        if (levels.length > 0) {
          console.log('HLS Levels detected:', levels.length);
          
          const formattedLevels = levels.map((level, index) => ({
            id: index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            name: `${level.height}p`
          }));
          
          setHlsLevels(formattedLevels);
          
          // Set current quality based on active level
          const currentLevel = internalPlayer.currentLevel;
          if (currentLevel >= 0) {
            setCurrentQuality(formattedLevels[currentLevel].name);
          } else {
            setCurrentQuality('auto');
          }
        }
      }
    }, 1500); // Increased timeout for better detection
  } catch (error) {
    console.error('Error detecting HLS levels:', error);
  }
};
```

#### 4. Quality Selector UI
Added quality control button and dropdown menu:
```javascript
<div className="quality-control">
  <button 
    className="quality-button" 
    onClick={toggleQualityMenu}
    title="Quality"
  >
    <FiSettings size={18} />
    <span className="quality-text">{currentQuality}</span>
  </button>
  
  {showQualityMenu && (
    <div className="quality-menu-dropdown">
      <button 
        className={`quality-option ${currentQuality === 'auto' ? 'active' : ''}`}
        onClick={() => handleQualityChange('auto')}
      >
        <span>Auto</span>
        {currentQuality === 'auto' && <FiCheck />}
      </button>
      
      {hlsLevels.map((level) => (
        <button 
          key={level.id}
          className={`quality-option ${currentQuality === level.name ? 'active' : ''}`}
          onClick={() => handleQualityChange(level.id)}
        >
          <span>{level.name}</span>
          {currentQuality === level.name && <FiCheck />}
        </button>
      ))}
    </div>
  )}
</div>
```

#### 5. Quality Change Handler
```javascript
const handleQualityChange = (qualityId) => {
  try {
    const player = playerRef.current;
    const internalPlayer = player?.getInternalPlayer('hls');
    
    if (!internalPlayer) {
      console.error('HLS player not available');
      return;
    }
    
    if (qualityId === 'auto') {
      // Enable adaptive streaming
      internalPlayer.currentLevel = -1;
      setCurrentQuality('auto');
    } else {
      // Set specific quality level
      internalPlayer.currentLevel = qualityId;
      const selectedLevel = hlsLevels.find(l => l.id === qualityId);
      if (selectedLevel) {
        setCurrentQuality(selectedLevel.name);
      }
    }
    
    setShowQualityMenu(false);
  } catch (error) {
    console.error('Error changing quality:', error);
  }
};
```

### CSS Styling (Watch.css)
```css
.quality-control {
  position: relative;
  margin: 0 8px;
}

.quality-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.quality-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.quality-menu-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: rgba(28, 28, 28, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.quality-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.quality-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.quality-option.active {
  background: rgba(62, 166, 255, 0.2);
  color: #3ea6ff;
}
```

## Testing Status

### ✅ Completed
- Quality selector UI implemented and styled
- HLS level detection logic enhanced with better error handling
- URL normalization to fix proxy issues
- Quality change handler implemented
- Auto quality mode working

### 🔄 Pending Tests
1. **HLS Level Detection**: Need to verify levels populate correctly with real videos
2. **Quality Switching**: Test if quality actually changes when user selects different option
3. **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge
4. **Mobile Devices**: Test on iOS and Android
5. **Network Conditions**: Test quality switching under different network speeds

## Known Issues

### Issue 1: HLS Levels May Not Populate
**Symptom**: Quality selector only shows "Auto", no other quality options

**Possible Causes**:
1. HLS.js not fully initialized when checking for levels
2. `internalPlayer.levels` is undefined or empty
3. Video doesn't have multiple quality variants

**Debugging**:
Open browser console and check for:
```
HLS Levels detected: X
```
If you see 0 or no message, levels aren't being detected.

**Solutions**:
1. Increased timeout from 1000ms to 1500ms (implemented)
2. Added type checking for `internalPlayer.levels` (implemented)
3. Added try-catch error handling (implemented)
4. Added console logging for debugging (implemented)

### Issue 2: Quality Not Actually Changing
**Symptom**: UI shows quality change but video quality doesn't change

**Possible Causes**:
1. HLS.js `currentLevel` not being set correctly
2. Player needs to be reloaded after quality change
3. Browser caching old quality

**Solutions**:
1. Verify `internalPlayer.currentLevel` is being set
2. Add player reload if needed
3. Test with network tab open to see quality change

## How to Test

### 1. Check Browser Console
Open any video and check console for:
```
HLS Levels detected: 6
Current HLS level: -1 (auto)
Available levels: [...]
```

### 2. Test Quality Selector
1. Open any video
2. Look for quality button with gear icon in player controls
3. Click to open quality menu
4. Should see: Auto, 360p, 240p, 144p (or whatever qualities exist)
5. Select a quality
6. Menu should close and quality text should update

### 3. Verify Quality Change
1. Open browser DevTools → Network tab
2. Filter by ".ts" files (HLS segments)
3. Play video in Auto mode - note segment URLs
4. Switch to 240p - segments should change to lower quality
5. Switch to 360p - segments should change to higher quality

### 4. Test URL Normalization
1. Check video playback URL in Network tab
2. Should be: `https://Xclub.b-cdn.net/videos/...`
3. Should NOT be: `/api/hls/...` (proxy URL)

## Video Format Requirements

For quality selector to work, videos must be:
1. **HLS format**: .m3u8 master playlist
2. **Multiple variants**: Different quality levels (144p, 240p, 360p, etc.)
3. **Properly encoded**: Each variant must have correct height metadata
4. **CDN accessible**: Files must be on Bunny CDN at `https://Xclub.b-cdn.net/videos/`

## Current Video Processing Pipeline

### Encoding (Local GPU)
Videos are encoded with FFmpeg using NVENC H.264:
```bash
-c:v h264_nvenc
-preset p4
-rc vbr
-cq 23
-b:v 2M
-maxrate 3M
-profile:v main
-level 4.0
```

### HLS Variants Generated
- 1080p: 5000k bitrate
- 720p: 2800k bitrate
- 480p: 1400k bitrate
- 360p: 800k bitrate
- 240p: 400k bitrate
- 144p: 200k bitrate

### Master Playlist
Each video should have a master.m3u8 that lists all variants:
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
```

## Troubleshooting Commands

### Check Video Files on CDN
```bash
curl -I https://Xclub.b-cdn.net/videos/USER_ID/VIDEO_ID/master.m3u8
curl https://Xclub.b-cdn.net/videos/USER_ID/VIDEO_ID/master.m3u8
```

### Check MongoDB Video Record
```javascript
db.videos.findOne({ _id: ObjectId("VIDEO_ID") })
// Look at: url, hlsUrl, qualities array
```

### Check Backend Logs
```bash
ssh -i "movia.pem" ubuntu@3.238.106.222 "pm2 logs backend --lines 100"
```

### Force Rebuild Client
```bash
ssh -i "movia.pem" ubuntu@3.238.106.222 "cd /home/ubuntu/YT/client && rm -rf build && npm run build"
```

## Next Steps

1. **Test with Real Videos**: Open several videos and verify quality selector populates
2. **Test Quality Switching**: Verify video quality actually changes
3. **Check Network Tab**: Confirm different .ts segment files are loaded
4. **Test Mobile**: Verify quality selector works on mobile devices
5. **User Feedback**: Get feedback on UI/UX of quality selector

## Related Files

### Modified Files
- `client/src/pages/Watch/Watch.js` - Quality selector logic
- `client/src/pages/Watch/Watch.css` - Quality selector styling
- `backend/.env` - Set HLS_ONLY=false

### Related Documentation
- `HLS_SETUP_GUIDE.md` - How HLS processing works
- `VIDEO_QUALITY_GUIDE.md` - Quality levels and encoding
- `ADMIN_SYSTEM_GUIDE.md` - Admin permissions for uploading

---
**Last Updated**: January 2025
**Status**: Implemented, awaiting production testing

# Manual EC2 Deployment Steps

## All code has been pushed to GitHub! ✅

The following fixes are now in the repository:
- ⚙️ Gear icon added to quality selector
- 🔊 Audio configuration improved
- 🏠 Localhost video playback support
- 👁️ Hide videos until processing completes (isPublished field)

---

## Deploy to EC2 (Run these commands on your EC2 server)

### Option 1: Quick Deploy (Copy & Paste All)
```bash
cd /home/ubuntu/YT
git pull origin main
npm install --production
cd client
npm install
npm run build
cd ..
pm2 restart backend
pm2 status
```

### Option 2: Step-by-Step

**Step 1: Connect to EC2**
```bash
ssh ubuntu@13.211.161.39
```

**Step 2: Navigate to project**
```bash
cd /home/ubuntu/YT
```

**Step 3: Pull latest code**
```bash
git pull origin main
```

**Step 4: Install backend dependencies**
```bash
npm install --production
```

**Step 5: Build React client**
```bash
cd client
npm install
npm run build
cd ..
```

**Step 6: Restart backend**
```bash
pm2 restart backend
```

**Step 7: Check status**
```bash
pm2 status
pm2 logs backend --lines 50
```

---

## What Was Fixed

### 1. Gear Icon ⚙️
- **File**: `client/src/pages/Watch/Watch.js`
- **Change**: Added `FiSettings` icon import and rendered in quality button
- **Result**: Quality selector now shows ⚙️ icon next to quality text (Auto, 720p, etc.)

### 2. Audio Settings 🔊
- **File**: `client/src/pages/Watch/Watch.js`
- **Changes**:
  - Added `playsInline: true` for mobile
  - Added `audioTrackSwitchingMode: 'immediate'` for HLS
  - Added `forceSafariHLS: true` for Safari browsers
  - Added audio debugging console logs
- **Result**: Better audio playback compatibility across browsers

### 3. Localhost Video Support 🏠
- **File**: `client/src/pages/Watch/Watch.js`
- **Changes**:
  - Updated `pickPlaybackUrl()` to detect localhost URLs
  - Updated `normalizePlaybackUrl()` to preserve localhost URLs
- **Result**: Videos uploaded from localhost (http://localhost:3000) will play directly

### 4. Hide Unprocessed Videos 👁️
- **Files**: 
  - `backend/models/Video.js` - Added `isPublished` field (default: false)
  - `backend/controllers/videoController.js` - Filter by `isPublished: true` for public
  - `backend/hlsWorker.js` - Set `isPublished: true` when processing completes
- **Result**: Videos are hidden from public until GPU processing finishes

---

## Testing After Deployment

1. **Gear Icon**: Open any video, you should see ⚙️ icon next to quality (Auto/720p/1080p)
2. **Audio**: Play a video, sound should work (check browser console if not)
3. **Localhost**: Upload a video from localhost, it should play
4. **Video Visibility**: New uploads won't show on homepage until processing completes

---

## Troubleshooting

### If gear icon still missing:
- Hard refresh browser: `Ctrl + Shift + R` (Chrome/Firefox) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Check console for errors: `F12` → Console tab

### If audio not working:
- Check browser console for autoplay policy errors
- Try clicking play button (some browsers block autoplay with audio)
- Check if video has audio track (some videos might be silent)

### If videos not showing:
- Check video `isPublished` status in MongoDB
- Admins/upload admins should see all videos
- Regular users only see `isPublished: true` videos

---

## Current File Sizes (After Build)

- Main JS: **122.15 KB** (gzipped) ✅
- CSS: 20.51 KB
- Build Status: **SUCCESS** ✅

All changes committed and pushed to: `https://github.com/sahanvin2/YT.git`

---

## Need Help?

If deployment fails, check:
1. PM2 logs: `pm2 logs backend --lines 100`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Backend errors: `cd /home/ubuntu/YT && npm start` (test mode)

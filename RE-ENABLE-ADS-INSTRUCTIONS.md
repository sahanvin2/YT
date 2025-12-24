# How to Re-Enable Ads After High Traffic Period

## Current Status
✅ All ads are **DISABLED** (commented out)
✅ Site is running clean without any ad interruptions
✅ No risk of crashes from ad popups during high traffic

## When to Re-Enable Ads
Wait until traffic returns to normal levels (typically a few days), then follow these steps:

## Steps to Re-Enable Ads

### 1. Edit Watch.js File
Open: `client/src/pages/Watch/Watch.js`

### 2. Uncomment Ad Imports (Lines 10-12)
**Find:**
```javascript
// TEMPORARILY DISABLED FOR HIGH TRAFFIC
// import { useSmartlinkAd } from '../../components/Ads/SmartlinkAd';
// import { useAds } from '../../context/AdContext';
```

**Change to:**
```javascript
import { useSmartlinkAd } from '../../components/Ads/SmartlinkAd';
import { useAds } from '../../context/AdContext';
```

### 3. Uncomment Ad Context (Lines 40-42)
**Find:**
```javascript
// TEMPORARILY DISABLED FOR HIGH TRAFFIC
// const { adConfig } = useAds();
// const { openSmartlink } = useSmartlinkAd();
```

**Change to:**
```javascript
const { adConfig } = useAds();
const { openSmartlink } = useSmartlinkAd();
```

### 4. Uncomment Ad URLs Array (Lines 55-67)
**Find:**
```javascript
// TEMPORARILY DISABLED FOR HIGH TRAFFIC - Ads commented out to prevent crashes
// Sequential ad URLs - shown one by one every 5 minutes
/* const adUrls = [
    'https://ferntravelleddeduct.com/gtrc1veb7i?key=...',
    ...
  ]; */
```

**Change to:**
```javascript
// Sequential ad URLs - shown one by one every 5 minutes
const adUrls = [
    'https://ferntravelleddeduct.com/gtrc1veb7i?key=...',
    ...
  ];
```

### 5. Uncomment Ad Logic in handleProgress (Lines 388-418)
**Find:**
```javascript
// TEMPORARILY DISABLED ADS FOR HIGH TRAFFIC
/* Show ad every 5 minutes (300 seconds)
   ... entire block commented ...
*/
```

**Change to:**
Remove the `/* */` and uncomment the entire block

### 6. Uncomment Ad in HTML5 Video onPlay (Lines 618-632)
**Find:**
```javascript
// TEMPORARILY DISABLED ADS FOR HIGH TRAFFIC
/* if (!firstAdShown && currentAdIndex < adUrls.length) {
   ... 
  } */
```

**Change to:**
Uncomment the if statement

### 7. Uncomment Ad in ReactPlayer onPlay (Lines 685-702)
**Find:**
```javascript
// TEMPORARILY DISABLED ADS FOR HIGH TRAFFIC
/* Show first ad when video starts playing (only once)
   ...
*/
```

**Change to:**
Uncomment the entire block

### 8. Rebuild and Deploy
```bash
cd d:\MERN\Movia\client
npm run build

cd ..
git add -A
git commit -m "Re-enable ads after high traffic period"
git push origin main

# Deploy to EC2
ssh -i "movia.pem" ubuntu@3.238.106.222 "cd ~/YT && git pull origin main && cd client && npm run build"
```

## Quick Search & Replace Method
Use VS Code find & replace to speed up the process:

1. Open Watch.js
2. Press `Ctrl+H` for find & replace
3. Enable regex mode (click `.*` button)

**Find:** `// TEMPORARILY DISABLED.*\n`
**Replace:** `` (empty)

**Find:** `/\* `
**Replace:** `` (empty)

**Find:** ` \*/`
**Replace:** `` (empty)

## Verification
After re-enabling:
- Video should open first ad after 3 seconds of play
- Additional ads should open every 5 minutes
- Video should NOT pause (ads open in new tab)
- All 10 ad URLs should cycle through

## Ad Schedule (When Enabled)
- **First ad:** Opens 3 seconds after video starts
- **Subsequent ads:** Every 5 minutes (5:00, 10:00, 15:00, 20:00, etc.)
- **Total ads:** 10 URLs that cycle through
- **Behavior:** Opens in new tab, video continues playing

## Note
Keep this file for future reference. The ads were disabled on December 25, 2025 due to high traffic concerns.

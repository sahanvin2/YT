# Ad System Setup Guide

This guide explains how to configure and use the ad system in your Movia video platform.

## Features

- ✅ **Banner Ads** - Top, bottom, and sidebar placements
- ✅ **Native Ads** - Content-like ads integrated into video lists
- ✅ **Pop-under Ads** - Triggered on video play or page load
- ✅ **Google AdSense Support** - Ready for AdSense integration
- ✅ **Custom Ad Networks** - Support for any ad network
- ✅ **Ad Frequency Control** - Control how often ads are shown
- ✅ **Responsive Design** - Ads adapt to screen size

## Quick Start

### 1. Enable Ad Provider

The `AdProvider` is already added to `App.js`. No changes needed.

### 2. Configure Ads

Edit `client/src/context/AdContext.js` to configure your ad settings:

```javascript
const [adConfig, setAdConfig] = useState({
  // Google AdSense (optional)
  googleAdSenseClientId: 'ca-pub-XXXXXXXXXX',
  
  // Ad network selection
  bannerAdNetwork: 'adsense', // or 'custom'
  nativeAdNetwork: 'adsense', // or 'custom'
  popUnderAdNetwork: 'custom',
  
  // Ad frequency
  nativeAdFrequency: 3, // Show native ad after every 3 videos
  popUnderFrequency: 'once-per-session',
  popUnderDelay: 5000, // 5 seconds delay
  
  // Custom ad codes (for custom networks)
  customBannerAds: {
    top: '<div>Your top banner ad HTML</div>',
    bottom: '<div>Your bottom banner ad HTML</div>',
    sidebar: '<div>Your sidebar ad HTML</div>'
  },
  customNativeAds: [
    '<div>Native Ad 1 HTML</div>',
    '<div>Native Ad 2 HTML</div>'
  ],
  customPopUnderAd: '<html><body>Your pop-under ad HTML</body></html>'
});
```

## Ad Placements

### Banner Ads

Banner ads are automatically placed:
- **Top**: Below navbar on all pages
- **Bottom**: Footer area on all pages
- **Sidebar**: In Watch page sidebar

```jsx
<BannerAd position="top" size="responsive" />
<BannerAd position="bottom" size="leaderboard" />
<BannerAd position="sidebar" size="medium-rectangle" />
```

**Available Sizes:**
- `responsive` - Auto-sizing (recommended)
- `leaderboard` - 728x90
- `banner` - 468x60
- `large-banner` - 970x250
- `medium-rectangle` - 300x250
- `wide-skyscraper` - 160x600

### Native Ads

Native ads appear in video lists:
- **Home Page**: Every 3rd video (configurable)
- **Watch Page Sidebar**: In suggested videos section

```jsx
<NativeAd position="video-list" index={index} />
<NativeAd position="sidebar" index={1} />
```

### Pop-under Ads

Pop-under ads are triggered automatically:
- **On Video Play**: After 5 seconds delay (configurable)
- **On Page Load**: Optional

```jsx
<PopUnderAd trigger="video-play" />
<PopUnderAd trigger="page-load" />
```

## Google AdSense Setup

### 1. Get AdSense Account

1. Sign up at https://www.google.com/adsense/
2. Get your Publisher ID (format: `ca-pub-XXXXXXXXXX`)

### 2. Configure AdSense

In `AdContext.js`:

```javascript
googleAdSenseClientId: 'ca-pub-XXXXXXXXXX',
bannerAdNetwork: 'adsense',
nativeAdNetwork: 'adsense',
```

### 3. Get Ad Slots

For each ad placement, you need an Ad Slot ID from AdSense:

```javascript
bannerAdSlots: {
  top: '1234567890',
  bottom: '0987654321',
  sidebar: '1122334455'
},
nativeAdSlots: {
  'video-list': '5566778899',
  sidebar: '9988776655'
}
```

### 4. Update AdContext

Add ad slots to the config:

```javascript
const [adConfig, setAdConfig] = useState({
  // ... existing config
  bannerAdSlots: {
    top: 'YOUR_TOP_SLOT_ID',
    bottom: 'YOUR_BOTTOM_SLOT_ID',
    sidebar: 'YOUR_SIDEBAR_SLOT_ID'
  },
  nativeAdSlots: {
    'video-list': 'YOUR_NATIVE_SLOT_ID',
    sidebar: 'YOUR_SIDEBAR_NATIVE_SLOT_ID'
  }
});
```

## Custom Ad Network Setup

### 1. Banner Ads

Add your ad HTML to `customBannerAds`:

```javascript
customBannerAds: {
  top: `
    <div id="top-banner-ad">
      <script src="https://your-ad-network.com/ads.js"></script>
      <div class="ad-container" data-ad-id="top-banner"></div>
    </div>
  `,
  bottom: '<!-- Your bottom ad code -->',
  sidebar: '<!-- Your sidebar ad code -->'
}
```

### 2. Native Ads

Add native ad HTML to array:

```javascript
customNativeAds: [
  `
    <div class="native-ad-content">
      <img src="ad-image.jpg" alt="Ad" />
      <h3>Ad Title</h3>
      <p>Ad description</p>
      <a href="https://advertiser.com">Learn More</a>
    </div>
  `,
  // More native ads...
]
```

### 3. Pop-under Ads

Add pop-under HTML:

```javascript
customPopUnderAd: `
  <html>
    <head>
      <title>Advertisement</title>
    </head>
    <body>
      <script>
        window.location.href = 'https://advertiser.com';
      </script>
    </body>
  </html>
`
```

## Environment Variables (Optional)

You can use environment variables for sensitive data:

Create `.env` in `client/`:

```env
REACT_APP_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
REACT_APP_ADS_ENABLED=true
```

Then in `AdContext.js`:

```javascript
googleAdSenseClientId: process.env.REACT_APP_ADSENSE_CLIENT_ID || '',
```

## Ad Frequency Control

### Banner Ads

```javascript
bannerFrequency: 'always' // Show always
// or
bannerFrequency: 'once-per-session' // Show once per user session
```

### Native Ads

```javascript
nativeAdFrequency: 3 // Show after every 3 videos
```

### Pop-under Ads

```javascript
popUnderFrequency: 'once-per-session' // Once per session
// or
popUnderFrequency: 'once-per-day' // Once per day
popUnderDelay: 5000 // 5 seconds delay before showing
```

## Disable Ads

To disable all ads:

```javascript
const [adsEnabled, setAdsEnabled] = useState(false);
```

Or conditionally:

```javascript
// Disable for premium users
const { user } = useAuth();
const [adsEnabled, setAdsEnabled] = useState(!user?.isPremium);
```

## Testing Ads

### Development Mode

Ads show placeholders in development. To test:

1. Set `adsEnabled: true` in `AdContext`
2. Configure your ad network
3. Test in production build: `npm run build`

### Production Build

```bash
cd client
npm run build
```

## Ad Placement Locations

### Current Placements

1. **App.js**:
   - Top banner (below navbar)
   - Bottom banner (footer)

2. **Home.js**:
   - Native ads in video grid (every 3rd video)

3. **Watch.js**:
   - Top banner
   - Sidebar banner
   - Sidebar native ad
   - Pop-under on video play

### Adding More Placements

You can add ads anywhere:

```jsx
import BannerAd from '../../components/Ads/BannerAd';
import NativeAd from '../../components/Ads/NativeAd';

// In your component
<BannerAd position="custom" size="medium-rectangle" />
<NativeAd position="custom" index={0} />
```

## Troubleshooting

### Ads Not Showing

1. Check `adsEnabled` is `true`
2. Verify ad network configuration
3. Check browser console for errors
4. Ensure ad codes are valid HTML

### AdSense Not Loading

1. Verify Publisher ID is correct
2. Check AdSense account is approved
3. Ensure domain is verified in AdSense
4. Wait 24-48 hours after account creation

### Pop-under Blocked

Modern browsers block pop-unders. Consider:
- Using banner ads instead
- Showing in-page overlays
- Using native ads

## Best Practices

1. **Don't Overload**: Limit ads per page (2-3 max)
2. **User Experience**: Ensure ads don't block content
3. **Mobile Friendly**: Test on mobile devices
4. **Performance**: Lazy load ad scripts
5. **Compliance**: Follow ad network policies
6. **Analytics**: Track ad performance

## Revenue Optimization

1. **A/B Testing**: Test different ad placements
2. **Frequency**: Find optimal ad frequency
3. **Placement**: Test top vs bottom vs sidebar
4. **Format**: Test banner vs native vs pop-under
5. **Timing**: Optimize pop-under delay

## Support

For issues or questions:
- Check ad network documentation
- Review browser console errors
- Test with ad blockers disabled
- Verify ad network account status


# Tuski Branding & Configuration Guide

## Changes Made

### 1. Branding Updates
- ✅ Website name changed from "Movia" to "Tuski"
- ✅ Created custom Tuski logo (tusk-shaped SVG)
- ✅ Updated all references throughout the application

### 2. Color Scheme
- ✅ Changed primary color from **Red (#ff0000)** to **Purple (#9b59b6)**
- ✅ Updated all CSS variables
- ✅ Purple gradient: #9b59b6 → #8e44ad → #7d3c98

### 3. Dark Mode Only
- ✅ Removed theme toggle button
- ✅ Forced dark mode (no light mode option)
- ✅ Theme always set to dark

### 4. Categories Updated
- ✅ **Movies** - New category (primary)
- ✅ **Cosplay** - New category (primary)
- ✅ Music, Gaming, Education, Entertainment, News, Sports, Technology, Other

### 5. Smartlink Ads
- ✅ Smartlink ad system implemented
- ✅ Intercepts video play button
- ✅ Opens smartlink in popup
- ✅ Video plays after ad is closed
- ✅ Configurable via AdContext

## How to Configure Smartlink Ads

### Step 1: Update AdContext

Edit `client/src/context/AdContext.js`:

```javascript
const [adConfig, setAdConfig] = useState({
  // ... existing config
  
  // Smartlink ad settings
  smartlinkEnabled: true,
  smartlinkUrl: 'https://your-smartlink-url.com', // Your smartlink URL
  smartlinkFrequency: 'once-per-video', // 'once-per-video' | 'once-per-session' | 'always'
  
  // ... rest of config
});
```

### Step 2: How It Works

1. User clicks play on video
2. Smartlink ad opens in popup window
3. User views/closes the ad
4. Video automatically starts playing

### Step 3: Testing

1. Set `smartlinkEnabled: true`
2. Add your smartlink URL
3. Click play on any video
4. Ad should open, then video plays after closing

## How to Change Categories

### Option 1: Update Sidebar Categories

Edit `client/src/components/Sidebar/Sidebar.js`:

```javascript
const categories = [
  { path: '/category/Movies', icon: FiFilm, label: 'Movies' },
  { path: '/category/Cosplay', icon: FiUser, label: 'Cosplay' },
  { path: '/category/YourCategory', icon: FiIcon, label: 'Your Category' },
  // Add more categories...
];
```

### Option 2: Update Upload Form Categories

Edit `client/src/pages/Upload/Upload.js`:

```javascript
<select id="category" name="category" value={category} onChange={onChange}>
  <option value="Movies">Movies</option>
  <option value="Cosplay">Cosplay</option>
  <option value="YourCategory">Your Category</option>
  // Add more options...
</select>
```

### Option 3: Update Backend Default

Edit `backend/models/Video.js`:

```javascript
category: { 
  type: String, 
  default: 'Movies', // Change default category
  enum: ['Movies', 'Cosplay', 'Music', 'Gaming', ...] // Optional: restrict to specific categories
}
```

## Current Category List

1. **Movies** ⭐ (New)
2. **Cosplay** ⭐ (New)
3. Music
4. Gaming
5. Education
6. Entertainment
7. News
8. Sports
9. Technology
10. Other

## Color Palette

### Primary Purple Colors
- Main: `#9b59b6`
- Hover: `#8e44ad`
- Dark: `#7d3c98`

### CSS Variables
```css
--primary-color: #9b59b6;
--primary-color-hover: #8e44ad;
--primary-color-dark: #7d3c98;
```

## Logo Usage

The Tuski logo is available as a component:

```jsx
import TuskiLogo from '../../components/Logo/TuskiLogo';

// With text
<TuskiLogo size={32} showText={true} />

// Without text (icon only)
<TuskiLogo size={48} showText={false} />
```

## Files Modified

### Frontend
- `client/src/components/Logo/TuskiLogo.js` - New logo component
- `client/src/components/Logo/TuskiLogo.css` - Logo styles
- `client/src/components/Navbar/Navbar.js` - Updated logo and removed theme toggle
- `client/src/components/Sidebar/Sidebar.js` - Updated categories
- `client/src/pages/Upload/Upload.js` - Updated categories
- `client/src/pages/Auth/Login.js` - Updated branding
- `client/src/pages/Auth/Register.js` - Updated branding
- `client/src/pages/Watch/Watch.js` - Added smartlink ad integration
- `client/src/context/ThemeContext.js` - Forced dark mode
- `client/src/context/AdContext.js` - Added smartlink config
- `client/src/index.css` - Updated colors to purple

### New Components
- `client/src/components/Ads/SmartlinkAd.js` - Smartlink ad component
- `client/src/components/Ads/SmartlinkAd.css` - Smartlink styles

## Testing Checklist

- [ ] Logo displays correctly in navbar
- [ ] All "Movia" references changed to "Tuski"
- [ ] Purple color scheme applied throughout
- [ ] Dark mode is forced (no theme toggle)
- [ ] Categories show Movies and Cosplay
- [ ] Upload form has new categories
- [ ] Smartlink ad opens on video play
- [ ] Video plays after ad is closed
- [ ] Banner ads still work
- [ ] Native ads still work

## Next Steps

1. **Configure Smartlink URL**: Add your smartlink URL in `AdContext.js`
2. **Test Smartlink**: Click play on a video to test the ad flow
3. **Customize Categories**: Add/remove categories as needed
4. **Update Favicon**: Replace favicon with Tuski logo
5. **Update Meta Tags**: Update page titles and descriptions

## Notes

- Smartlink ads require popup permissions
- If popup is blocked, user will be prompted
- Ad frequency can be controlled (once per video, session, etc.)
- All existing banner and native ads still work
- Dark mode cannot be changed (forced)





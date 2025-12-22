# Subtitle Support Guide

## Overview
Your website now supports uploading and displaying subtitles for videos! Users can upload subtitle files in WebVTT (.vtt) or SRT (.srt) format, and viewers will see them automatically while watching videos.

## Features

### 1. **Upload Subtitles**
- Go to the Upload page
- After selecting your video and thumbnail, scroll to the **"Subtitles (Optional)"** section
- Click **"Add Subtitle Files (.vtt, .srt)"** to upload subtitle files
- You can upload multiple subtitle files for different languages

### 2. **Subtitle Settings**
For each subtitle file:
- **Label**: Customize the display name (e.g., "English", "Spanish CC")
- **Language**: Select from 12 supported languages:
  - English (en)
  - Spanish (es)
  - French (fr)
  - German (de)
  - Italian (it)
  - Portuguese (pt)
  - Russian (ru)
  - Japanese (ja)
  - Korean (ko)
  - Chinese (zh)
  - Arabic (ar)
  - Hindi (hi)

### 3. **Watch with Subtitles**
- When watching a video with subtitles, they automatically appear
- Use the video player's **CC button** (Closed Captions) to:
  - Turn subtitles on/off
  - Switch between different language tracks
  - The first uploaded subtitle is set as default

## Subtitle File Formats

### WebVTT (.vtt) - Recommended
```
WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to our video!

00:00:05.000 --> 00:00:10.000
This is how you add subtitles.
```

### SRT (.srt) - Also Supported
```
1
00:00:00,000 --> 00:00:05,000
Welcome to our video!

2
00:00:05,000 --> 00:00:10,000
This is how you add subtitles.
```

## How It Works

1. **Upload Process**:
   - Subtitle files are uploaded to B2 storage alongside your video
   - Each subtitle is stored with its language code and label
   - URLs are saved in the database linked to the video

2. **Video Player**:
   - Videos with subtitles use the native HTML5 video player
   - Videos without subtitles continue using ReactPlayer
   - Browser's built-in subtitle controls are available

3. **Styling**:
   - Subtitles appear in a readable format with dark background
   - Text is white with proper spacing
   - Responsive sizing for mobile devices

## Creating Subtitle Files

### Online Tools
- **YouTube Auto-Subtitle**: Upload to YouTube, download auto-generated subtitles
- **Subtitle Edit**: Free desktop app (Windows/Mac/Linux)
- **Aegisub**: Advanced subtitle editor
- **Happy Scribe**: Online transcription service

### Manual Creation
1. Play your video in a player that shows timestamps
2. Type text at each timestamp in your subtitle file
3. Save as `.vtt` or `.srt`
4. Test the subtitle file before uploading

### Format Conversion
- Many online converters can convert between SRT and VTT formats
- VTT is recommended for web compatibility

## Tips for Good Subtitles

1. **Timing**: Ensure subtitles sync perfectly with audio
2. **Length**: Keep lines short (max 2 lines per subtitle)
3. **Reading Speed**: Allow 2-3 seconds per subtitle
4. **Punctuation**: Use proper punctuation for clarity
5. **Speaker Labels**: Use [Speaker Name]: for multiple speakers

## Troubleshooting

### Subtitles Not Appearing
- Check that subtitle file has `.vtt` or `.srt` extension
- Verify the file is properly formatted
- Try re-uploading the subtitle file
- Check browser console for errors

### Subtitle Timing Off
- Edit the subtitle file to adjust timestamps
- Re-upload the corrected version

### Wrong Language Displayed
- Change the language dropdown when uploading
- The first subtitle uploaded is set as default

## Technical Details

### Storage
- Subtitles stored in B2: `subtitles/{userId}/{timestamp}_{index}.vtt`
- Served via Bunny CDN for fast delivery
- CORS enabled for cross-origin access

### Database Structure
```javascript
subtitles: [{
  language: 'en',
  label: 'English',
  url: 'https://cdn.example.com/subtitle.vtt',
  isDefault: true
}]
```

### Browser Support
- All modern browsers support HTML5 video subtitles
- Mobile devices: iOS Safari, Android Chrome
- Desktop: Chrome, Firefox, Safari, Edge

## Future Enhancements

Possible features to add:
- Auto-generate subtitles using speech-to-text API
- Edit subtitles directly in the browser
- Community-contributed subtitles
- Subtitle styling customization
- Multiple subtitle tracks per language (CC vs SDH)

---

**Need Help?**
If you encounter any issues with subtitle uploads or playback, check:
1. Backend logs: `pm2 logs backend`
2. Browser console for JavaScript errors
3. Network tab to verify subtitle file loads

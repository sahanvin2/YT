# 🚀 Quick Upload Pre-Processed HLS Videos

This feature allows you to upload already-processed HLS videos **instantly** without waiting for video processing!

## 📋 What You Need

A folder containing your processed HLS video with this structure:
```
my-video/
├── master.m3u8          (required)
├── hls_144p/
│   ├── playlist.m3u8
│   └── *.ts files
├── hls_240p/
├── hls_360p/
├── hls_480p/
└── thumbnail.jpg        (optional)
```

## 🎯 Quick Start

### Method 1: Using the Upload Script (Easiest)

```bash
node upload-hls-video.js "path/to/your/video-folder" "Video Title" --genre action --category movies
```

**Full Example:**
```bash
node upload-hls-video.js "D:\Videos\inception-hls" "Inception" \
  --description "A mind-bending thriller" \
  --category movies \
  --genre action \
  --tags "thriller,scifi,nolan" \
  --duration 8880 \
  --thumbnail "D:\Videos\inception-poster.jpg"
```

### Method 2: Using the API Directly

```javascript
POST /api/videos/upload-hls-folder
Authorization: Bearer <your-admin-token>
Content-Type: application/json

{
  "hlsFolderPath": "D:\\Videos\\my-video-hls",
  "title": "My Video Title",
  "description": "Video description",
  "mainCategory": "movies",
  "primaryGenre": "action",
  "tags": ["tag1", "tag2"],
  "visibility": "public",
  "duration": 7200,
  "thumbnailPath": "D:\\Videos\\thumbnail.jpg"
}
```

## ✨ Features

✅ **Instant Upload** - No waiting for video processing  
✅ **All Qualities** - Upload all quality variants at once  
✅ **Immediate Playback** - Videos are ready to watch instantly  
✅ **Batch Upload** - Upload multiple videos easily  
✅ **Custom Thumbnails** - Include your own thumbnail  

## 📝 Options

| Option | Description | Example |
|--------|-------------|---------|
| `--description` | Video description | `--description "Epic movie"` |
| `--category` | Main category | `--category movies` |
| `--genre` | Primary genre | `--genre action` |
| `--tags` | Comma-separated tags | `--tags "action,thriller"` |
| `--visibility` | public or private | `--visibility public` |
| `--duration` | Duration in seconds | `--duration 7200` |
| `--thumbnail` | Path to thumbnail | `--thumbnail "path/to/thumb.jpg"` |

## 🎬 Available Categories

- `movies` - Feature films
- `series` - TV series/episodes
- `documentaries` - Documentary content
- `animation` - Animated content

## 🎭 Available Genres

action, comedy, drama, horror, thriller, romance, scifi, fantasy, crime, mystery, adventure, documentary, animation, family, war, western, musical, sport, biography, history, other

## 🔐 First Time Setup

When you first run the upload script, you'll be asked to login with your admin credentials. The token will be saved for future uploads.

## 💡 Tips

1. **Check your HLS folder** - Make sure `master.m3u8` exists
2. **Use absolute paths** - Full paths work best (e.g., `D:\Videos\...`)
3. **Quality folders** - Named `hls_144p`, `hls_240p`, etc.
4. **Thumbnails** - JPG or PNG, will be auto-detected or specify with `--thumbnail`

## 🆚 Old vs New Method

### Old Method (Slow):
1. Upload raw video file (large, slow)
2. Wait for processing queue
3. Video gets encoded to HLS
4. Processed video uploaded to B2
5. Finally playable (minutes to hours)

### New Method (Fast): 
1. Upload pre-processed HLS folder
2. Files go directly to B2
3. Immediately playable! (seconds)

## 🐛 Troubleshooting

**Error: "master.m3u8 not found"**
- Make sure your folder contains a `master.m3u8` file

**Error: "Folder not found"**
- Use absolute path: `D:\Videos\...` instead of relative paths

**Error: "Authentication failed"**
- Delete `.admin-token` file and login again
- Make sure you're using an admin account

## 📞 Support

For issues or questions, check the main documentation or contact support.

---

**Pro Tip:** Process your videos locally using ffmpeg, then upload the HLS folder. This way you can have videos ready instantly without server processing!

# 🎬 Local Video Processor Guide

Process and upload videos directly to B2 storage without using the website!

## 🚀 Quick Start

### Single Video Processing
```bash
# Basic usage
node local-video-processor.js "C:\Movies\video.mp4" "Amazing Movie"

# With description
node local-video-processor.js movie.mkv "Epic Film" "A great movie about adventure"

# With category and genre
node local-video-processor.js series.mp4 "Episode 1" "First episode" --category series --genre drama
```

### Batch Processing (Multiple Videos)
```bash
# Process all videos in a folder
node batch-video-processor.js "C:\Movies"

# With specific category/genre for all videos
node batch-video-processor.js "./videos" --category movies --genre action
```

## 📋 Features

### ✅ What It Does
- **Processes videos locally** - Uses your full CPU/GPU power
- **Creates HLS format** - Multiple quality levels (360p, 480p, 720p, 1080p)
- **Direct B2 upload** - No website upload limits
- **Auto database entries** - Videos appear in your site automatically
- **Batch processing** - Handle entire folders of videos
- **Smart quality selection** - Only creates qualities that make sense for input resolution

### 🎯 Benefits vs Website Upload
- ✅ **No size limits** - Process 10GB+ videos
- ✅ **No timeouts** - Process for hours if needed
- ✅ **Better quality** - Full control over encoding settings
- ✅ **Faster processing** - Use your local machine's full power
- ✅ **Bulk uploads** - Process entire movie collections

## 🛠️ Configuration

### Environment Required
Make sure your `.env` file has:
```env
B2_BUCKET=your-bucket-name
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_ACCESS_KEY_ID=your-key
B2_SECRET_ACCESS_KEY=your-secret
B2_PUBLIC_BASE=https://f005.backblazeb2.com/file/your-bucket
MONGO_URI=your-mongodb-uri
ADMIN_USER_ID=your-admin-user-id
```

### Supported Formats
- MP4, MKV, AVI, MOV, WMV, FLV, WebM, M4V
- Any resolution (will create appropriate quality levels)

## 📊 Processing Output

### What Gets Created
1. **HLS Segments** - Video split into 6-second chunks
2. **Multiple Qualities** - 360p, 480p, 720p, 1080p (based on input)
3. **Master Playlist** - Adaptive bitrate streaming
4. **Database Entry** - Video appears on your site immediately

### File Structure in B2
```
hls/
├── user-id/
│   ├── video-id-1/
│   │   ├── master.m3u8
│   │   ├── hls_360p/
│   │   │   ├── playlist.m3u8
│   │   │   ├── segment_000.ts
│   │   │   └── segment_001.ts
│   │   ├── hls_720p/
│   │   └── hls_1080p/
│   └── video-id-2/
```

## 🎮 Advanced Usage

### Custom Options
```bash
# Specific category and genre
node local-video-processor.js movie.mp4 "Title" --category movies --genre horror

# TV Series
node local-video-processor.js episode.mkv "S01E01" --category series --genre drama

# Documentary
node local-video-processor.js doc.mp4 "Nature Doc" --category documentaries --genre nature
```

### Batch with Custom Settings
```bash
# Process movie collection
node batch-video-processor.js "C:\Movies\Action" --category movies --genre action

# Process TV series
node batch-video-processor.js "C:\Series\Drama" --category series --genre drama
```

## 🐛 Troubleshooting

### Common Issues

#### FFmpeg Not Found
```bash
npm install ffmpeg-static ffprobe-static
```

#### B2 Connection Error
- Check your B2 credentials in `.env`
- Verify bucket name and endpoint

#### MongoDB Connection Error
- Check your MongoDB URI
- Ensure database is accessible

#### Large File Processing
- Ensure enough disk space for temporary files
- Processing time depends on video length and your CPU

## 💡 Pro Tips

1. **Organize by folders** - Keep movies/series/docs in separate folders
2. **Use descriptive filenames** - The tool extracts titles from filenames
3. **Monitor disk space** - Large videos need temporary space during processing
4. **Process overnight** - Large batches can take hours
5. **Check output** - Videos appear at `http://localhost:3000/watch/VIDEO_ID`

## 🔗 Integration

After processing, videos will:
- ✅ Appear in your video library
- ✅ Be playable immediately  
- ✅ Support adaptive quality streaming
- ✅ Work with your existing player
- ✅ Be served via CDN if configured

---

**Your local video processing powerhouse is ready! 🚀**
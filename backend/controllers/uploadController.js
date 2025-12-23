const Video = require('../models/Video');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const mime = require('mime-types');
const crypto = require('crypto');
const { uploadFile, deleteFile, presignPut, publicUrl } = require('../utils/b2');
const { addToQueue } = require('../utils/videoQueueBullMQ');
const { notifyFollowersNewVideo } = require('./notificationController');


ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

function computeChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(fileBuffer).digest('hex');
}

// Upload video + optional thumbnail
exports.uploadVideo = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      mainCategory, 
      primaryGenre, 
      secondaryGenres, 
      subCategory,
      tags, 
      visibility 
    } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    // Check file size (5GB = 5368709120 bytes)
    if (req.files.video.size > 3221225472) {
      return res.status(413).json({ 
        success: false, 
        message: 'File too large. Maximum size is 5GB' 
      });
    }

    const videoFile = req.files.video;
    const thumbnailFile = req.files.thumbnail;
    const tmpDir = '/tmp/movia';
    fs.mkdirSync(tmpDir, { recursive: true });

    const ts = Date.now();
    const videoExt = path.extname(videoFile.name) || '.mp4';
    const tmpVideoPath = path.join(tmpDir, `video_${ts}${videoExt}`);
    await videoFile.mv(tmpVideoPath);

    // Compute checksum
    const checksum = computeChecksum(tmpVideoPath);

    // Upload video to B2
    const videoKey = `videos/${req.user.id}/${ts}_${videoFile.name}`;
    const videoCT = mime.lookup(tmpVideoPath) || 'application/octet-stream';
    const videoUrl = await uploadFile(tmpVideoPath, videoKey, videoCT);

    // Upload thumbnail
    let thumbnailUrl;
    if (thumbnailFile) {
      const thumbExt = path.extname(thumbnailFile.name) || '.jpg';
      const tmpThumbPath = path.join(tmpDir, `thumb_${ts}${thumbExt}`);
      await thumbnailFile.mv(tmpThumbPath);
      const thumbKey = `thumbnails/${req.user.id}/${ts}_${thumbnailFile.name}`;
      const thumbCT = mime.lookup(tmpThumbPath) || 'image/jpeg';
      thumbnailUrl = await uploadFile(tmpThumbPath, thumbKey, thumbCT);
      fs.unlinkSync(tmpThumbPath);
    }

    // Upload subtitles
    let subtitleTracks = [];
    if (req.files && req.files.subtitles) {
      const subtitleFilesArray = Array.isArray(req.files.subtitles) 
        ? req.files.subtitles 
        : [req.files.subtitles];
      
      const subtitleLanguages = req.body.subtitleLanguages 
        ? (Array.isArray(req.body.subtitleLanguages) ? req.body.subtitleLanguages : [req.body.subtitleLanguages])
        : [];
      
      const subtitleLabels = req.body.subtitleLabels 
        ? (Array.isArray(req.body.subtitleLabels) ? req.body.subtitleLabels : [req.body.subtitleLabels])
        : [];

      for (let i = 0; i < subtitleFilesArray.length; i++) {
        const subFile = subtitleFilesArray[i];
        const subExt = path.extname(subFile.name) || '.vtt';
        const tmpSubPath = path.join(tmpDir, `subtitle_${ts}_${i}${subExt}`);
        await subFile.mv(tmpSubPath);
        
        const subKey = `subtitles/${req.user.id}/${ts}_${i}${subExt}`;
        const subCT = mime.lookup(tmpSubPath) || 'text/vtt';
        const subUrl = await uploadFile(tmpSubPath, subKey, subCT);
        
        subtitleTracks.push({
          language: subtitleLanguages[i] || 'en',
          label: subtitleLabels[i] || `Subtitle ${i + 1}`,
          url: subUrl,
          isDefault: i === 0 // First subtitle is default
        });
        
        fs.unlinkSync(tmpSubPath);
      }
    }

    // Get duration
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tmpVideoPath, (err, data) => {
        if (err) return resolve(0);
        resolve(Math.round(data.format.duration || 0));
      });
    });

    fs.unlinkSync(tmpVideoPath);

    // Parse secondary genres if it's a JSON string
    let parsedSecondaryGenres = [];
    if (secondaryGenres) {
      try {
        parsedSecondaryGenres = typeof secondaryGenres === 'string' 
          ? JSON.parse(secondaryGenres) 
          : secondaryGenres;
      } catch (e) {
        parsedSecondaryGenres = [];
      }
    }

    // Create DB record with new category structure
    const video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      subtitles: subtitleTracks,
      duration,
      mainCategory: mainCategory || 'movies',
      primaryGenre: primaryGenre || 'action',
      secondaryGenres: parsedSecondaryGenres || [],
      subCategory: subCategory || null,
      category: primaryGenre || 'action', // Legacy field for backwards compatibility
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visibility: visibility || 'public',
      user: req.user.id,
      originalName: videoFile.name,
      checksum,
      processingStatus: 'queued' // Mark as queued for transcoding
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    // Send to worker EC2 for transcoding (non-blocking)
    addToQueue(video._id.toString(), videoUrl, req.user.id).catch(err => {
      console.error('Failed to queue video for transcoding:', err);
    });

    // Notify followers of new video
    notifyFollowersNewVideo(req.user.id, {
      _id: video._id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl
    }).catch(err => {
      console.error('Failed to notify followers:', err);
    });

    res.status(201).json({ 
      success: true, 
      data: video,
      message: 'Video uploaded successfully. Processing will begin shortly.' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up any temp files on error
    try {
      const tmpDir = '/tmp/movia';
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        files.forEach(file => {
          try {
            fs.unlinkSync(path.join(tmpDir, file));
          } catch (e) {
            // Ignore cleanup errors
          }
        });
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Send user-friendly error message
    let errorMessage = 'An internal error occurred. Please retry your upload.';
    
    if (error.message.includes('ENOSPC')) {
      errorMessage = 'Server storage full. Please contact support.';
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      errorMessage = 'Upload timeout. Please try again with a stable connection.';
    } else if (error.message.includes('ECONNRESET')) {
      errorMessage = 'Connection lost during upload. Please retry.';
    } else if (error.message.includes('file size')) {
      errorMessage = 'File too large. Maximum size is 5GB.';
    } else if (error.message.includes('B2') || error.message.includes('storage')) {
      errorMessage = 'Storage service error. Please try again later.';
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Presign endpoint for direct browser upload
exports.presignUpload = async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, message: 'fileName and contentType required' });
    }
    const ts = Date.now();
    const key = `videos/${req.user.id}/${ts}_${fileName}`;
    const url = await presignPut(key, contentType);
    res.json({ success: true, url, key, publicUrl: publicUrl(key), expiresIn: 900 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

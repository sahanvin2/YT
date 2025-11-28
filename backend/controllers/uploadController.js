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


ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

function computeChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(fileBuffer).digest('hex');
}

// Upload video + optional thumbnail
exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, category, tags, visibility } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
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

    // Get duration
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tmpVideoPath, (err, data) => {
        if (err) return resolve(0);
        resolve(Math.round(data.format.duration || 0));
      });
    });

    fs.unlinkSync(tmpVideoPath);

    // Create DB record
    const video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visibility: visibility || 'public',
      user: req.user.id,
      originalName: videoFile.name,
      checksum
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    res.status(201).json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

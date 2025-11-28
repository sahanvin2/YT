const Video = require('../models/Video');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
// Use CJS-friendly mime-types package to avoid ESM interop issues
const mime = require('mime-types');
const { uploadFilePath, deleteFile } = require('../utils/b2');

const axios = require('axios');

// Configure ffmpeg/ffprobe paths (use static binaries)
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

// Extract R2 object key from a public URL (supports r2.dev and cloudflarestorage.com forms)
function r2KeyFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('.b2.dev')) {
      return decodeURIComponent(u.pathname.slice(1)); // remove leading '/'
    }
    const parts = u.pathname.split('/').filter(Boolean);
    // For cloudflarestorage.com/<bucket>/<key..>
    return decodeURIComponent(parts.slice(1).join('/'));
  } catch {
    return null;
  }
}

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
exports.getVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, sort = '-createdAt' } = req.query;
    
    const query = { visibility: 'public' };
    if (category && category !== 'all') {
      query.category = category;
    }

    const videos = await Video.find(query)
      .populate('user', 'username avatar channelName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments(query);

    res.status(200).json({
      success: true,
      data: videos,
      // Backwards compatibility: some clients expect 'videos'
      videos: videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Public
exports.getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('user', 'username avatar channelName subscribers')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username avatar' },
        options: { sort: { createdAt: -1 } }
      });

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload video (R2 storage)
// @route   POST /api/videos
// @access  Private
exports.uploadVideo = async (req, res, next) => {
  try {
    const { title, description, category, tags, visibility } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'Please upload a video file' });
    }

    const videoFile = req.files.video;
    const thumbnailFile = req.files.thumbnail;

    const maxSizeBytes = parseInt(process.env.MAX_VIDEO_SIZE_MB || '500') * 1024 * 1024;
    if (videoFile.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: `Video file exceeds maximum size of ${Math.round(maxSizeBytes / (1024*1024))}MB`
      });
    }

    // Use temp directory for staging before R2 upload
    const tmpDir = '/tmp/movia';
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch {}
    const ts = Date.now();
    const videoExt = path.parse(videoFile.name).ext || '.mp4';
    const tmpVideoPath = path.join(tmpDir, `video_${ts}${videoExt}`);
    await videoFile.mv(tmpVideoPath);

    // Upload to R2
    const videoKey = `videos/${req.user.id}/${ts}_${path.basename(tmpVideoPath)}`;
    const videoCT = mime.lookup(tmpVideoPath) || 'application/octet-stream';
    const videoUrl = await uploadFilePath(tmpVideoPath, videoKey, videoCT);

    // Optional thumbnail upload (if provided)
    let thumbnailUrl;
    if (thumbnailFile) {
      const thumbExt = path.parse(thumbnailFile.name).ext || '.jpg';
      const tmpThumbPath = path.join(tmpDir, `thumb_${ts}${thumbExt}`);
      await thumbnailFile.mv(tmpThumbPath);
      const thumbKey = `thumbnails/${req.user.id}/${ts}_${path.basename(tmpThumbPath)}`;
      const thumbCT = mime.lookup(tmpThumbPath) || 'image/jpeg';
      thumbnailUrl = await uploadFilePath(tmpThumbPath, thumbKey, thumbCT);
      try { await fs.promises.unlink(tmpThumbPath); } catch {}
    }

    // Duration probing (best-effort)
    let duration = 0;
    try {
      duration = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tmpVideoPath, (err, data) => {
          if (err) return reject(err);
          try {
            const d = Math.round(data.format.duration || 0);
            resolve(isNaN(d) ? 0 : d);
          } catch { resolve(0); }
        });
      });
    } catch { duration = 0; }

    // Cleanup temp video file
    fs.unlink(tmpVideoPath, () => {});

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
      sources: []
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    res.status(201).json({ success: true, data: video, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create video record from an existing R2 URL (client uploaded via presign)
// @route   POST /api/videos/create
// @access  Private
exports.createVideoFromUrl = async (req, res) => {
  try {
    const { title, description, category, tags, visibility, videoUrl, thumbnailUrl, duration } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'title and videoUrl are required' });
    }
    const video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration: duration ? parseInt(duration) : 0,
      category,
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : (Array.isArray(tags) ? tags : []),
      visibility: visibility || 'public',
      user: req.user.id,
      sources: []
    });
    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });
    res.status(201).json({ success: true, data: video, video });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private
exports.updateVideo = async (req, res, next) => {
  try {
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    // Make sure user is video owner
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this video' 
      });
    }

    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    video = await Video.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: video,
      video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this video' });
    }

    // Helper to safely derive key "<folder>/<filename>"
    function deriveKey(url) {
      if (!url || typeof url !== 'string') return null;
      const parts = url.split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return parts.slice(-2).join('/');
    }

    // Delete main video file
    const mainKey = deriveKey(video.videoUrl);
    if (mainKey) {
      try { await deleteFile(mainKey); } catch {}
    }

    // Delete thumbnail
    if (video.thumbnailUrl) {
      const thumbKey = deriveKey(video.thumbnailUrl);
      if (thumbKey) {
        try { await deleteFile(thumbKey); } catch {}
      }
    }

    // Delete variant files if present (supports video.variants or video.sources)
    const variantList = Array.isArray(video.variants) ? video.variants : (Array.isArray(video.sources) ? video.sources : []);
    for (const variant of variantList) {
      const vKey = deriveKey(variant.url || variant.videoUrl || variant.sourceUrl);
      if (vKey) {
        try { await deleteFile(vKey); } catch {}
      }
    }

    await video.deleteOne();
    await User.findByIdAndUpdate(req.user.id, { $pull: { videos: video._id } });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like/Unlike video
// @route   PUT /api/videos/:id/like
// @access  Private
exports.likeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    const alreadyLiked = video.likes.includes(req.user.id);

    if (alreadyLiked) {
      // Unlike
      video.likes = video.likes.filter(id => id.toString() !== req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { likedVideos: video._id }
      });
    } else {
      // Like
      video.likes.push(req.user.id);
      // Remove from dislikes if exists
      video.dislikes = video.dislikes.filter(id => id.toString() !== req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { likedVideos: video._id }
      });
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes.length,
        dislikes: video.dislikes.length,
        isLiked: !alreadyLiked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dislike video
// @route   PUT /api/videos/:id/dislike
// @access  Private
exports.dislikeVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    const alreadyDisliked = video.dislikes.includes(req.user.id);

    if (alreadyDisliked) {
      // Remove dislike
      video.dislikes = video.dislikes.filter(id => id.toString() !== req.user.id);
    } else {
      // Dislike
      video.dislikes.push(req.user.id);
      // Remove from likes if exists
      video.likes = video.likes.filter(id => id.toString() !== req.user.id);
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { likedVideos: video._id }
      });
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes.length,
        dislikes: video.dislikes.length,
        isDisliked: !alreadyDisliked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const View = require('../models/View');

// @desc    Increment view count (records individual view event)
// @route   PUT /api/videos/:id/view
// @access  Public
exports.addView = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Always increment (counts multiple watches by same user)
    video.views += 1;
    await video.save();

    // Record a view event
    try {
      await View.create({
        video: video._id,
        user: req.user ? req.user.id : undefined,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    } catch (e) {
      // Silently ignore view logging errors
    }

    res.status(200).json({ success: true, data: { views: video.views } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search videos
// @route   GET /api/videos/search
// @access  Public
exports.searchVideos = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a search query' 
      });
    }

    const videos = await Video.find({
      $text: { $search: q },
      visibility: 'public'
    })
      .populate('user', 'username avatar channelName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Video.countDocuments({
      $text: { $search: q },
      visibility: 'public'
    });

    res.status(200).json({
      success: true,
      data: videos,
      videos: videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending videos
// @route   GET /api/videos/trending
// @access  Public
exports.getTrendingVideos = async (req, res, next) => {
  try {
    const { limit = 12 } = req.query;

    const videos = await Video.find({ visibility: 'public' })
      .populate('user', 'username avatar channelName')
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: videos,
      videos: videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate signed URL to stream a private B2 video
// @route   GET /api/videos/:id/stream
// @access  Public



exports.streamVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // the S3 URL of Backblaze B2 is already stored in video.videoUrl
    const fileUrl = video.videoUrl;

    const range = req.headers.range;

    if (!range) {
      return res.status(416).json({ success: false, message: "Range header required" });
    }

    const videoSizeReq = await axios.head(fileUrl);
    const videoSize = Number(videoSizeReq.headers['content-length']);

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4"
    };

    res.writeHead(206, headers);

    const stream = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
      headers: {
        Range: `bytes=${start}-${end}`
      }
    });

    stream.data.pipe(res);

  } catch (err) {
    console.error("STREAM ERROR:", err.message);
    res.status(500).json({ success: false, error: "Stream failed" });
  }
};

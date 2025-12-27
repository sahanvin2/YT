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
const { generateVideoVariants, getVideoResolution } = require('../utils/videoTranscoder');
const { cdnUrlFrom, extractKeyFromUrl } = require('../utils/cdn');
const { addToHLSQueue } = require('../utils/hlsQueue');
const { uploadHlsFolderToB2 } = require('../utils/uploadHlsFolder');

// HLS-only mode: when enabled, the app serves only HLS (.m3u8) playback URLs.
// Non-HLS videos are treated as "processing" and can be auto-queued for HLS conversion.
const HLS_ONLY = String(process.env.HLS_ONLY || 'true').toLowerCase() === 'true';

// Log CDN configuration on startup
const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL;
if (CDN_BASE) {
  console.log(`🌐 Bunny CDN configured: ${CDN_BASE}`);
} else {
  console.warn('⚠️ CDN_BASE not set - videos will be served directly from B2');
  console.warn('   To enable CDN, add CDN_BASE=https://Xclub.b-cdn.net to your .env file');
}

const axios = require('axios');

function isAbsoluteHttpUrl(value) {
  if (typeof value !== 'string') return false;
  return /^https?:\/\//i.test(value.trim());
}

function isPlaceholderUrl(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'processing';
}

async function downloadToLocalTmp(sourceUrl, videoId) {
  const urlObj = new URL(sourceUrl);
  const ext = path.extname(urlObj.pathname) || '.mp4';
  const tmpDir = path.join(__dirname, '../../tmp/reprocess');
  fs.mkdirSync(tmpDir, { recursive: true });
  const localPath = path.join(tmpDir, `reprocess_${videoId}_${Date.now()}${ext}`);

  const resp = await axios.get(sourceUrl, {
    responseType: 'stream',
    timeout: 600000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true
  });

  if (!(resp.status >= 200 && resp.status < 300)) {
    throw new Error(`Failed to download source (${resp.status}) from ${sourceUrl}`);
  }

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(localPath);
    resp.data.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });

  return localPath;
}

async function autoQueueHlsIfNeeded(videoDoc) {
  if (!HLS_ONLY) return;
  if (!videoDoc) return;
  if (videoDoc.hlsUrl) return;
  if (videoDoc.processingStatus === 'queued' || videoDoc.processingStatus === 'processing') return;

  const sourceUrl = videoDoc.videoUrl || videoDoc.cdnUrl;
  if (!isAbsoluteHttpUrl(sourceUrl) || isPlaceholderUrl(sourceUrl)) return;

  const userId = (videoDoc.user && videoDoc.user._id ? videoDoc.user._id.toString() : String(videoDoc.user));

  // Set status first to avoid double-queueing if multiple requests hit.
  await Video.findByIdAndUpdate(videoDoc._id, {
    processingStatus: 'queued',
    processingError: null,
    videoUrl: 'processing'
  });

  // Download + enqueue in background
  (async () => {
    try {
      const localPath = await downloadToLocalTmp(sourceUrl, videoDoc._id.toString());
      await addToHLSQueue(videoDoc._id.toString(), localPath, userId);
      console.log(`✅ Auto-queued HLS processing for video ${videoDoc._id}`);
    } catch (e) {
      console.error(`❌ Auto-queue HLS failed for video ${videoDoc._id}:`, e.message);
      await Video.findByIdAndUpdate(videoDoc._id, {
        processingStatus: 'failed',
        processingError: e.message
      });
    }
  })();
}

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
    const { page = 1, limit = 12, category, sort = '-createdAt', clips } = req.query;

    const query = { visibility: 'public' };
    if (category && category !== 'all') {
      // Check if category is a main category (movies, series, documentaries, animation)
      const mainCategories = ['movies', 'series', 'documentaries', 'animation'];
      if (mainCategories.includes(category)) {
        query.mainCategory = category;
      } else {
        // Otherwise it's a genre, search in primaryGenre or secondaryGenres
        query.$or = [
          { primaryGenre: category },
          { secondaryGenres: category }
        ];
      }
    }
    
    // Only show videos that are ready (not still processing or failed)
    if (HLS_ONLY) {
      query.hlsUrl = { $exists: true, $ne: null };
      query.processingStatus = { $in: ['completed', undefined, null] };
    } else {
      query.processingStatus = { $in: ['completed', undefined, null] };
      query.videoUrl = { $ne: 'processing' }; // Exclude videos with placeholder URL
    }
    
    // Filter for clips (videos under 2 minutes / less than 120 seconds)
    if (clips === 'true') {
      query.duration = { $lt: 120 };
    }

    let videos = await Video.find(query)
      .populate('user', 'username avatar channelName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    videos = videos.map(video => {
      let videoObj = video.toObject(); // convert Mongoose doc to plain object
      
      // Prioritize HLS URL if available
      const hlsUrl = videoObj.hlsUrl;
      const original = hlsUrl || videoObj.filePath || videoObj.url || videoObj.path || videoObj.videoUrl;
      
      // Convert main video URL to CDN URL
      videoObj.cdnUrl = cdnUrlFrom(original);
      
      // Set videoUrl based on format
      if (hlsUrl) {
        // ✅ Keep proxy URLs as-is (don't convert to CDN)
        if (hlsUrl.includes('/api/hls/')) {
          videoObj.videoUrl = hlsUrl; // Keep proxy URL
        } else {
          videoObj.videoUrl = cdnUrlFrom(hlsUrl); // Convert B2/CDN URLs
        }
        videoObj.isHLS = true;
      } else {
        if (HLS_ONLY) {
          videoObj.videoUrl = 'processing';
          videoObj.isHLS = false;
        } else {
          videoObj.videoUrl = videoObj.cdnUrl;
          videoObj.isHLS = false;
        }
      }
      
      // Convert thumbnail URL to CDN URL
      if (videoObj.thumbnailUrl) {
        videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
      }
      
      // Convert variant URLs to CDN URLs (for backwards compatibility)
      if (videoObj.variants && Array.isArray(videoObj.variants)) {
        videoObj.variants = videoObj.variants.map(variant => ({
          ...variant,
          url: cdnUrlFrom(variant.url || variant.videoUrl || variant.sourceUrl),
          cdnUrl: cdnUrlFrom(variant.url || variant.videoUrl || variant.sourceUrl)
        }));
      }
      
      // Also update sources array (for compatibility)
      if (videoObj.sources && Array.isArray(videoObj.sources)) {
        videoObj.sources = videoObj.sources.map(source => ({
          ...source,
          url: cdnUrlFrom(source.url || source.videoUrl || source.sourceUrl),
          cdnUrl: cdnUrlFrom(source.url || source.videoUrl || source.sourceUrl)
        }));
      }
      
      return videoObj;
    });

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

// @desc    Get top creators (by public video count)
// @route   GET /api/videos/creators
// @access  Public
exports.getTopCreators = async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const { category } = req.query;

    const match = { visibility: 'public', user: { $ne: null } };
    if (category && category !== 'all') {
      const mainCategories = ['movies', 'series', 'documentaries', 'animation'];
      if (mainCategories.includes(category)) {
        match.mainCategory = category;
      } else {
        match.$or = [{ primaryGenre: category }, { secondaryGenres: category }];
      }
    }

    const creators = await Video.aggregate([
      { $match: match },
      { $group: { _id: '$user', videoCount: { $sum: 1 } } },
      { $sort: { videoCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          avatar: '$user.avatar',
          channelName: '$user.channelName',
          videoCount: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: creators });
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

    // Check if video is published (hide unpublished videos from non-admins)
    const isAdmin = req.user?.isAdmin || req.user?.isUploadAdmin;
    const isOwner = req.user?.id?.toString() === (video.user._id?.toString() || video.user.toString());
    
    if (!video.isPublished && !isAdmin && !isOwner) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or still processing'
      });
    }

    // In HLS-only mode, auto-queue HLS processing for non-HLS videos.
    // This lets old MP4/MKV videos become playable without manual deletion.
    if (HLS_ONLY) {
      await autoQueueHlsIfNeeded(video);
    }

    // Check if user can view private video
    const requestingUserId = req.user?.id;
    const videoOwnerId = video.user._id?.toString() || video.user.toString();
    if (video.visibility === 'private' && (!requestingUserId || requestingUserId.toString() !== videoOwnerId)) {
      return res.status(403).json({
        success: false,
        message: 'This video is private'
      });
    }
    const videoObj = video.toObject(); // convert Mongoose doc to plain object
    
    // Prioritize HLS URL if available
    const hlsUrl = videoObj.hlsUrl;
    const original = hlsUrl || videoObj.filePath || videoObj.url || videoObj.path || videoObj.videoUrl;
    
    // Convert to CDN URL
    videoObj.cdnUrl = cdnUrlFrom(original);
    
    // Set videoUrl based on format
    if (hlsUrl) {
      // HLS streaming - use master playlist
      // ✅ Keep proxy URLs as-is (don't convert to CDN)
      if (hlsUrl.includes('/api/hls/')) {
        videoObj.videoUrl = hlsUrl; // Keep proxy URL
        console.log(`📺 HLS video ${video._id} (using proxy): ${videoObj.videoUrl}`);
      } else {
        videoObj.videoUrl = cdnUrlFrom(hlsUrl); // Convert B2/CDN URLs
        console.log(`📺 HLS video ${video._id} (using CDN): ${videoObj.videoUrl}`);
      }
      videoObj.isHLS = true;
    } else {
      if (HLS_ONLY) {
        videoObj.videoUrl = 'processing';
        videoObj.isHLS = false;
        if (videoObj.processingStatus === 'completed' || !videoObj.processingStatus) {
          videoObj.processingStatus = 'queued';
        }
      } else {
        // Fallback to regular video URL
        videoObj.videoUrl = videoObj.cdnUrl;
        videoObj.isHLS = false;
      }
    }
    
    // Debug: Log URL conversion
    if (original !== videoObj.cdnUrl) {
      console.log(`✅ CDN URL conversion for video ${video._id}:`);
      console.log(`   Original: ${original}`);
      console.log(`   CDN URL: ${videoObj.cdnUrl}`);
    } else {
      console.warn(`⚠️ CDN URL not converted for video ${video._id} (CDN_BASE may not be set)`);
    }
    
    // Convert thumbnail URL to CDN URL
    if (videoObj.thumbnailUrl) {
      const originalThumb = videoObj.thumbnailUrl;
      videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
      if (originalThumb !== videoObj.thumbnailUrl) {
        console.log(`   Thumbnail CDN: ${videoObj.thumbnailUrl}`);
      }
    }
    
    // Convert variant URLs to CDN URLs
    if (videoObj.variants && Array.isArray(videoObj.variants)) {
      videoObj.variants = videoObj.variants.map(variant => {
        const originalVariantUrl = variant.url || variant.videoUrl || variant.sourceUrl;
        const cdnVariantUrl = cdnUrlFrom(originalVariantUrl);
        return {
          ...variant,
          url: cdnVariantUrl,
          cdnUrl: cdnVariantUrl
        };
      });
    }
    
    // Also update sources array (for compatibility)
    if (videoObj.sources && Array.isArray(videoObj.sources)) {
      videoObj.sources = videoObj.sources.map(source => {
        const originalSourceUrl = source.url || source.videoUrl || source.sourceUrl;
        const cdnSourceUrl = cdnUrlFrom(originalSourceUrl);
        return {
          ...source,
          url: cdnSourceUrl,
          cdnUrl: cdnSourceUrl
        };
      });
    }

    res.status(200).json({
      success: true,
      data: videoObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload video (DISABLED - HLS folders only)
// @route   POST /api/videos
// @access  Private
exports.uploadVideo = async (req, res, next) => {
  return res.status(400).json({
    success: false,
    message: 'Direct video upload is disabled. Please upload pre-processed HLS folders using /api/videos/upload-hls-folder endpoint.',
    hint: 'Use the upload-hls-video.js script or see HLS_UPLOAD_GUIDE.md for instructions.'
  });
  
  /* OLD CODE - DISABLED
  try {
    const { title, description, category, tags, visibility } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'Please upload a video file' });
    }

    const videoFile = req.files.video;
    const thumbnailFile = req.files.thumbnail;

    const maxSizeBytes = parseInt(process.env.MAX_VIDEO_SIZE_MB || '5120') * 1024 * 1024;
    if (videoFile.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: `Video file exceeds maximum size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB`
      });
    }

    // Use temp directory - keep local for HLS processing
    const tmpDir = path.join(__dirname, '../../tmp/uploads');
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch { }
    const ts = Date.now();
    const videoExt = path.parse(videoFile.name).ext || '.mp4';
    const tmpVideoPath = path.join(tmpDir, `upload_${req.user.id}_${ts}${videoExt}`);
    
    console.log(`📥 Receiving upload: ${videoFile.name} (${Math.round(videoFile.size / 1024 / 1024)}MB)`);
    await videoFile.mv(tmpVideoPath);

    // No need to upload original to B2 - HLS processor will upload HLS files
    const videoUrl = null; // Will be set after HLS processing

    // Thumbnail handling
    let thumbnailUrl = '';

    if (thumbnailFile) {
      // User provided thumbnail
      const thumbExt = path.parse(thumbnailFile.name).ext || '.jpg';
      const tmpThumbPath = path.join(tmpDir, `thumb_${ts}${thumbExt}`);
      await thumbnailFile.mv(tmpThumbPath);
      const thumbKey = `thumbnails/${req.user.id}/${ts}_${path.basename(tmpThumbPath)}`;
      const thumbCT = mime.lookup(tmpThumbPath) || 'image/jpeg';
      thumbnailUrl = await uploadFilePath(tmpThumbPath, thumbKey, thumbCT);
      try { await fs.promises.unlink(tmpThumbPath); } catch { }
    } else {
      // Auto-generate thumbnail
      try {
        const tmpThumbPath = path.join(tmpDir, `thumb_auto_${ts}.jpg`);

        await new Promise((resolve, reject) => {
          ffmpeg(tmpVideoPath)
            .screenshots({
              timestamps: ['1'], // Take screenshot at 1 second
              filename: path.basename(tmpThumbPath),
              folder: tmpDir,
              size: '1280x720'
            })
            .on('end', resolve)
            .on('error', reject);
        });

        const thumbKey = `thumbnails/${req.user.id}/${ts}_auto.jpg`;
        thumbnailUrl = await uploadFilePath(tmpThumbPath, thumbKey, 'image/jpeg');
        try { await fs.promises.unlink(tmpThumbPath); } catch { }
      } catch (err) {
        console.error('Error generating auto-thumbnail:', err);
        // Continue without thumbnail if generation fails
      }
    }

    // Duration and resolution probing
    let duration = 0;
    let videoHeight = 720; // Default height
    try {
      const probeData = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tmpVideoPath, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });

      duration = Math.round(probeData.format.duration || 0);
      const videoStream = probeData.streams.find(s => s.codec_type === 'video');
      if (videoStream && videoStream.height) {
        videoHeight = videoStream.height;
      }
    } catch (err) {
      console.error('Error probing video:', err);
      duration = 0;
    }

    // Create video record with queued status
    const video = await Video.create({
      title,
      description,
      videoUrl: videoUrl || 'processing', // Temporary placeholder
      hlsUrl: null, // Will be set by HLS worker
      thumbnailUrl,
      duration,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visibility: visibility || 'public',
      user: req.user.id,
      originalName: videoFile.name,
      variants: [],
      sources: [],
      processingStatus: 'queued' // Always queue for HLS processing
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    // Add to HLS processing queue (local GPU processing with NVENC)
    try {
      await addToHLSQueue(video._id.toString(), tmpVideoPath, req.user.id);
      console.log(`✅ Video ${video._id} queued for HLS processing (GPU acceleration)`);
    } catch (queueError) {
      console.error('Failed to queue video for HLS processing:', queueError);
      // Update video status to failed
      await Video.findByIdAndUpdate(video._id, {
        processingStatus: 'failed',
        processingError: 'Failed to queue for processing'
      });
    }

    // Return immediately (HLS processing will happen in background with GPU)
    const videoObj = video.toObject();
    if (videoObj.thumbnailUrl) {
      videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
    }

    res.status(201).json({
      success: true,
      data: videoObj,
      video: videoObj,
      message: 'Video uploaded successfully! Processing to HLS format with GPU acceleration (NVIDIA NVENC). This will take a few minutes.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  */
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

    const videoObj = video.toObject();
    // Convert URLs to CDN URLs
    videoObj.cdnUrl = cdnUrlFrom(video.videoUrl);
    videoObj.videoUrl = videoObj.cdnUrl; // Use CDN URL for streaming
    if (videoObj.thumbnailUrl) {
      videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
    }
    res.status(201).json({ success: true, data: videoObj });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// @desc    Upload pre-processed HLS video folder (skip processing)
// @route   POST /api/videos/upload-hls-folder
// @access  Private (Admin only)
exports.uploadHlsFolder = async (req, res) => {
  try {
    const { 
      hlsFolderPath, 
      title, 
      description, 
      category,
      mainCategory,
      primaryGenre,
      secondaryGenres,
      tags, 
      visibility,
      duration,
      thumbnailPath
    } = req.body;

    // Validate required fields
    if (!hlsFolderPath || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'hlsFolderPath and title are required' 
      });
    }

    // Check if folder exists
    if (!fs.existsSync(hlsFolderPath)) {
      return res.status(400).json({ 
        success: false, 
        message: `Folder not found: ${hlsFolderPath}` 
      });
    }

    // Check for master.m3u8
    const masterPath = path.join(hlsFolderPath, 'master.m3u8');
    if (!fs.existsSync(masterPath)) {
      return res.status(400).json({ 
        success: false, 
        message: 'master.m3u8 not found in folder. Please ensure this is a valid HLS video folder.' 
      });
    }

    console.log(`📁 Starting HLS folder upload for: ${title}`);
    
    // Create video entry first to get ID
    const video = new Video({
      title,
      description,
      category: category || 'other',
      mainCategory: mainCategory || 'movies',
      primaryGenre: primaryGenre || 'other',
      secondaryGenres: Array.isArray(secondaryGenres) ? secondaryGenres : [],
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : (Array.isArray(tags) ? tags : []),
      visibility: visibility || 'public',
      user: req.user.id,
      duration: duration ? parseInt(duration) : 0,
      videoUrl: 'processing',
      processingStatus: 'processing'
    });

    await video.save();
    const videoId = video._id.toString();

    console.log(`✅ Video entry created with ID: ${videoId}`);

    // Upload HLS folder to B2
    const uploadResult = await uploadHlsFolderToB2(hlsFolderPath, videoId);

    // Upload thumbnail if provided
    let thumbnailUrl = uploadResult.thumbnailUrl;
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      console.log(`📸 Uploading custom thumbnail...`);
      const thumbKey = `thumbnails/${videoId}${path.extname(thumbnailPath)}`;
      thumbnailUrl = await uploadFilePath(thumbnailPath, thumbKey, 'image/jpeg');
    }

    // Update video with HLS URLs
    video.hlsUrl = uploadResult.hlsUrl;
    video.videoUrl = uploadResult.hlsUrl;
    video.thumbnailUrl = thumbnailUrl;
    video.processingStatus = 'completed';
    video.isPublished = true;
    
    // Add variants info
    if (uploadResult.variants && uploadResult.variants.length > 0) {
      video.sources = uploadResult.variants.map(v => ({
        quality: v.resolution,
        url: v.url,
        type: 'application/x-mpegURL'
      }));
    }

    await video.save();

    // Add to user's videos
    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    console.log(`✅ HLS video uploaded successfully: ${title}`);

    // Convert URLs to CDN URLs for response
    const videoObj = video.toObject();
    videoObj.cdnUrl = cdnUrlFrom(videoObj.hlsUrl);
    videoObj.videoUrl = videoObj.cdnUrl;
    if (videoObj.thumbnailUrl) {
      videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
    }

    res.status(201).json({ 
      success: true, 
      data: videoObj,
      uploadStats: {
        filesUploaded: uploadResult.uploadedFiles,
        totalSize: uploadResult.totalSize,
        variants: uploadResult.variants.length
      }
    });

  } catch (error) {
    console.error('❌ HLS folder upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload HLS folder' 
    });
  }
};

// @desc    Upload HLS folder with files (new user-friendly version)
// @route   POST /api/videos/upload-hls-complete
// @access  Private
exports.uploadHlsComplete = async (req, res) => {
  try {
    const { title, description, mainCategory, primaryGenre, tags, duration } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required' 
      });
    }

    if (!req.files || !req.files.hlsFiles || !req.files.thumbnail) {
      return res.status(400).json({ 
        success: false, 
        message: 'HLS files and thumbnail are required' 
      });
    }

    const hlsFiles = Array.isArray(req.files.hlsFiles) ? req.files.hlsFiles : [req.files.hlsFiles];
    const thumbnailFile = req.files.thumbnail;

    // Check for master.m3u8
    const hasMaster = hlsFiles.some(file => file.name === 'master.m3u8');
    if (!hasMaster) {
      return res.status(400).json({ 
        success: false, 
        message: 'master.m3u8 file is required in HLS folder' 
      });
    }

    console.log(`📁 Starting HLS complete upload for: ${title}`);
    console.log(`   Files received: ${hlsFiles.length}`);

    // Create video entry
    const video = new Video({
      title,
      description: description || '',
      mainCategory: mainCategory || 'movies',
      primaryGenre: primaryGenre || 'action',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      visibility: 'public',
      user: req.user.id,
      duration: duration ? parseInt(duration) : 0,
      videoUrl: 'processing',
      processingStatus: 'uploading'
    });

    await video.save();
    const videoId = video._id.toString();
    console.log(`✅ Video entry created with ID: ${videoId}`);

    // Upload thumbnail first
    console.log(`📸 Uploading thumbnail...`);
    const thumbExt = path.extname(thumbnailFile.name) || '.jpg';
    const thumbKey = `thumbnails/${req.user.id}/${Date.now()}_thumb_${videoId}${thumbExt}`;
    const thumbnailUrl = await uploadFilePath(thumbnailFile.tempFilePath, thumbKey, thumbnailFile.mimetype);
    console.log(`✅ Thumbnail uploaded: ${thumbnailUrl}`);

    // Upload all HLS files
    console.log(`📦 Uploading ${hlsFiles.length} HLS files...`);
    let uploadedFiles = 0;
    let totalSize = 0;
    const variants = [];

    for (const file of hlsFiles) {
      // Reconstruct folder structure from filename
      const relativePath = file.name.replace(/\\/g, '/');
      const hlsKey = `hls/${req.user.id}/${videoId}/${relativePath}`;
      
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      await uploadFilePath(file.tempFilePath, hlsKey, mimeType);
      
      uploadedFiles++;
      totalSize += file.size;

      // Track quality variants
      if (relativePath.includes('/') && relativePath.includes('hls_')) {
        const qualityMatch = relativePath.match(/hls_(\d+p)/);
        if (qualityMatch) {
          const quality = qualityMatch[1];
          if (!variants.find(v => v.resolution === quality)) {
            variants.push({
              resolution: quality,
              url: `/api/hls/${req.user.id}/${videoId}/hls_${quality}/playlist.m3u8`
            });
          }
        }
      }
    }

    console.log(`✅ All HLS files uploaded (${uploadedFiles} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB)`);

    // Update video with URLs
    const hlsUrl = `/api/hls/${req.user.id}/${videoId}/master.m3u8`;
    video.hlsUrl = hlsUrl;
    video.videoUrl = hlsUrl;
    video.thumbnailUrl = thumbnailUrl;
    video.processingStatus = 'completed';
    video.isPublished = true;

    if (variants.length > 0) {
      video.sources = variants.map(v => ({
        quality: v.resolution,
        url: v.url,
        type: 'application/x-mpegURL'
      }));
    }

    await video.save();

    // Add to user's videos
    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    console.log(`✅ HLS video uploaded successfully: ${title}`);

    // Convert to CDN URLs
    const videoObj = video.toObject();
    videoObj.cdnUrl = cdnUrlFrom(videoObj.hlsUrl);
    videoObj.videoUrl = videoObj.cdnUrl;
    if (videoObj.thumbnailUrl) {
      videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
    }

    res.status(201).json({ 
      success: true, 
      data: videoObj,
      message: 'Video uploaded successfully!'
    });

  } catch (error) {
    console.error('❌ HLS complete upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload video' 
    });
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

    // Handle thumbnail update
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail;
      const tmpDir = path.join(__dirname, '../../tmp');
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch { }

      const ts = Date.now();
      const thumbExt = path.parse(thumbnailFile.name).ext || '.jpg';
      const tmpThumbPath = path.join(tmpDir, `thumb_update_${ts}${thumbExt}`);

      await thumbnailFile.mv(tmpThumbPath);

      const thumbKey = `thumbnails/${req.user.id}/${ts}_update${thumbExt}`;
      const thumbCT = mime.lookup(tmpThumbPath) || 'image/jpeg';

      // Delete old thumbnail if exists
      if (video.thumbnailUrl) {
        try {
          // Extract key from old URL
          const oldKey = video.thumbnailUrl.split('/').slice(-2).join('/');
          if (oldKey) await deleteFile(oldKey);
        } catch (e) {
          console.error('Error deleting old thumbnail:', e);
        }
      }

      const newThumbnailUrl = await uploadFilePath(tmpThumbPath, thumbKey, thumbCT);
      req.body.thumbnailUrl = newThumbnailUrl;

      try { await fs.promises.unlink(tmpThumbPath); } catch { }
    }

    // Handle tags - can be string (comma-separated) or JSON string
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(req.body.tags);
          if (Array.isArray(parsed)) {
            req.body.tags = parsed;
          } else {
            // Fallback to comma-separated string
            req.body.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          }
        } catch {
          // Not JSON, treat as comma-separated string
          req.body.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      }
    }

    // Handle cut parameters
    if (req.body.cutStart !== undefined) {
      req.body.cutStart = parseFloat(req.body.cutStart) || 0;
    }
    if (req.body.cutEnd !== undefined) {
      req.body.cutEnd = parseFloat(req.body.cutEnd) || null;
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
      try { await deleteFile(mainKey); } catch { }
    }

    // Delete thumbnail
    if (video.thumbnailUrl) {
      const thumbKey = deriveKey(video.thumbnailUrl);
      if (thumbKey) {
        try { await deleteFile(thumbKey); } catch { }
      }
    }

    // Delete variant files if present (supports video.variants or video.sources)
    const variantList = Array.isArray(video.variants) ? video.variants : (Array.isArray(video.sources) ? video.sources : []);
    for (const variant of variantList) {
      const vKey = deriveKey(variant.url || variant.videoUrl || variant.sourceUrl);
      if (vKey) {
        try { await deleteFile(vKey); } catch { }
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

    const alreadyLiked = video.likes.some(id => id.toString() === req.user.id.toString());

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

    const alreadyDisliked = video.dislikes.some(id => id.toString() === req.user.id.toString());

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

    const userId = req.user ? req.user.id : null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || req.ip;
    
    // Check if this view was already counted (within last 24 hours for same user/IP)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let existingView = null;
    
    try {
      existingView = await View.findOne({
        video: video._id,
        $or: [
          ...(userId ? [{ user: userId }] : []),
          { ip: ip }
        ],
        createdAt: { $gte: oneDayAgo }
      });
    } catch (e) {
      console.error('⚠️ Error checking existing view:', e.message);
      // Continue without checking for duplicates
    }

    // Only count if this is a new view (not viewed in last 24 hours)
    if (!existingView) {
      video.views += 1;
      await video.save();

      // Record a view event
      try {
        await View.create({
          video: video._id,
          user: userId,
          ip: ip
        });
      } catch (e) {
        // Silently ignore view logging errors
        console.error('⚠️ Error recording view:', e.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      data: { 
        views: video.views,
        counted: !existingView
      } 
    });
  } catch (error) {
    console.error('❌ Error in addView:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search videos (supports partial matching)
// @route   GET /api/videos/search
// @access  Public
exports.searchVideos = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const searchQuery = q.trim();

    // Use regex for partial matching (case-insensitive)
    // This allows searching by title, description, or tags
    const regexQuery = new RegExp(searchQuery, 'i');

    const query = {
      visibility: 'public',
      $or: [
        { title: regexQuery },
        { description: regexQuery },
        { tags: { $in: [regexQuery] } }
      ]
    };
    
    // Hide unpublished videos from non-admins
    if (!req.user || (!req.user.isAdmin && !req.user.isUploadAdmin)) {
      query.isPublished = true;
    }

    let videos = await Video.find(query)
      .populate('user', 'username avatar channelName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Convert URLs to CDN URLs
    videos = videos.map(video => {
      let videoObj = video.toObject();
      const original = videoObj.filePath || videoObj.url || videoObj.path || videoObj.videoUrl;
      videoObj.cdnUrl = cdnUrlFrom(original);
      videoObj.videoUrl = videoObj.cdnUrl;
      if (videoObj.thumbnailUrl) {
        videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
      }
      return videoObj;
    });

    const count = await Video.countDocuments(query);

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

// @desc    Get search suggestions (autocomplete)
// @route   GET /api/videos/search/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        data: [],
        suggestions: []
      });
    }

    const searchQuery = q.trim();
    const regexQuery = new RegExp(searchQuery, 'i');

    // Get matching video titles and descriptions for suggestions
    const videos = await Video.find({
      visibility: 'public',
      $or: [
        { title: regexQuery },
        { description: regexQuery }
      ]
    })
      .select('title _id thumbnailUrl')
      .limit(parseInt(limit))
      .sort({ views: -1 })
      .exec();

    // Extract unique titles as suggestions
    const suggestions = videos.map(video => ({
      title: video.title,
      id: video._id,
      thumbnailUrl: video.thumbnailUrl ? cdnUrlFrom(video.thumbnailUrl) : video.thumbnailUrl
    }));

    res.status(200).json({
      success: true,
      data: suggestions,
      suggestions: suggestions
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

    const query = { visibility: 'public' };
    
    // Hide unpublished videos from non-admins
    if (!req.user || (!req.user.isAdmin && !req.user.isUploadAdmin)) {
      query.isPublished = true;
    }

    let videos = await Video.find(query)
      .populate('user', 'username avatar channelName')
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit))
      .exec();

    // Convert URLs to CDN URLs
    videos = videos.map(video => {
      let videoObj = video.toObject();
      const original = videoObj.filePath || videoObj.url || videoObj.path || videoObj.videoUrl;
      videoObj.cdnUrl = cdnUrlFrom(original);
      videoObj.videoUrl = videoObj.cdnUrl;
      if (videoObj.thumbnailUrl) {
        videoObj.thumbnailUrl = cdnUrlFrom(videoObj.thumbnailUrl);
      }
      return videoObj;
    });

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
    const { quality } = req.query; // Optional quality parameter

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Determine which video URL to use (use CDN URL)
    let fileUrl = cdnUrlFrom(video.videoUrl); // Default to original, converted to CDN

    // If quality is specified, find matching variant
    if (quality && quality !== 'orig' && quality !== 'auto') {
      const variants = video.variants || video.sources || [];
      const variant = variants.find(v => String(v.quality) === String(quality));
      if (variant) {
        // Use CDN URL for variant
        const variantUrl = variant.url || variant.videoUrl || variant.sourceUrl;
        fileUrl = cdnUrlFrom(variantUrl);
      }
    }

    const range = req.headers.range;

    // Check if this is a CDN URL
    const isBunnyCdn = fileUrl.includes('b-cdn.net');
    const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL;
    const isCdnUrl = (CDN_BASE && fileUrl.includes(CDN_BASE)) || isBunnyCdn;

    if (!range) {
      // If no range header, redirect to CDN URL for download
      return res.redirect(fileUrl);
    }

    // For CDN URLs, let the CDN handle range requests directly
    // We can proxy the request or redirect to CDN with range header
    if (isCdnUrl) {
      // Bunny CDN supports range requests, so we can proxy or redirect
      // For better performance, redirect to CDN with range header
      // But we need to get video size first for proper range handling
      try {
        const videoSizeReq = await axios.head(fileUrl);
        const videoSize = Number(videoSizeReq.headers['content-length']);

        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        // Proxy the range request to CDN
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
        console.error("CDN Stream Error:", err.message);
        // Fallback: redirect to CDN URL
        return res.redirect(fileUrl);
      }
    } else {
      // For non-CDN URLs (direct B2/R2), use existing logic
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
    }

  } catch (err) {
    console.error("STREAM ERROR:", err.message);
    res.status(500).json({ success: false, error: "Stream failed" });
  }
};

// @desc    Get download URL for video (with quality selection)
// @route   GET /api/videos/:id/download
// @access  Public
exports.getDownloadUrl = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { quality } = req.query; // Quality parameter: '144', '240', '360', etc. or 'orig' for original

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Use CDN URL for download
    let downloadUrl = cdnUrlFrom(video.videoUrl); // Default to original, converted to CDN
    let qualityLabel = 'Original';

    // If quality is specified and not 'orig', find matching variant
    if (quality && quality !== 'orig' && quality !== 'auto') {
      const variants = video.variants || video.sources || [];
      const variant = variants.find(v => String(v.quality) === String(quality));
      if (variant) {
        // Use CDN URL for variant
        const variantUrl = variant.url || variant.videoUrl || variant.sourceUrl;
        downloadUrl = cdnUrlFrom(variantUrl);
        qualityLabel = `${quality}p`;
      }
    }

    // Get video title for filename
    const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_${qualityLabel}.mp4`;

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: downloadUrl,
        filename: filename,
        quality: qualityLabel
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Proxy video download to avoid CORS/Direct link issues
// @route   GET /api/videos/:id/download-file
// @access  Public
// @desc    Redirect to signed download URL (bypasses server proxy)
// @route   GET /api/videos/:id/download-file
// @access  Public
exports.downloadVideoProxy = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { quality } = req.query;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Use CDN URL for download
    let fileUrl = cdnUrlFrom(video.videoUrl);
    let qualityLabel = 'Original';

    // Try to find requested quality
    if (quality && quality !== 'orig' && quality !== 'auto') {
      const variants = video.variants || video.sources || [];
      const variant = variants.find(v => String(v.quality) === String(quality));
      if (variant) {
        // Use CDN URL for variant
        const variantUrl = variant.url || variant.videoUrl || variant.sourceUrl;
        fileUrl = cdnUrlFrom(variantUrl);
        qualityLabel = `${quality}p`;
      }
    }

    // Get video title for filename
    const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_${qualityLabel}.mp4`;

    // Check if this is a Bunny CDN URL or other CDN URL
    const isBunnyCdn = fileUrl.includes('b-cdn.net');
    const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL;
    const isCdnUrl = (CDN_BASE && fileUrl.includes(CDN_BASE)) || isBunnyCdn;
    
    // If it's a CDN URL, redirect directly to CDN URL
    // Browser will handle the download, and we can't force filename for CDN URLs
    // Frontend should use getDownloadUrl endpoint instead which returns JSON
    if (isCdnUrl) {
      console.log(`📥 Redirecting to CDN URL for download: ${fileUrl}`);
      console.log(`   Filename: ${filename}`);
      // Direct redirect - browser will download the file
      return res.redirect(fileUrl);
    }
    
    // If not CDN URL, try to extract key and generate signed URL (fallback for direct B2/R2 access)
    let key = extractKeyFromUrl(fileUrl);
    
    if (!key) {
      try {
        const u = new URL(fileUrl);
        if (u.hostname.endsWith('.b2.dev') || u.hostname.includes('backblazeb2.com')) {
          // Standard B2 URL: https://f000.backblazeb2.com/file/<bucket>/<key>
          const parts = u.pathname.split('/').filter(Boolean);
          if (parts[0] === 'file' && parts.length > 2) {
            key = parts.slice(2).join('/');
          } else {
            key = decodeURIComponent(u.pathname.slice(1));
          }
        } else if (u.hostname.includes('r2.dev') || u.hostname.includes('cloudflarestorage.com')) {
          key = r2KeyFromUrl(fileUrl);
        } else {
          key = decodeURIComponent(u.pathname.slice(1));
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
    }

    if (!key) {
      // Fallback to redirecting to the public URL if we can't determine key
      return res.redirect(fileUrl);
    }

    // Generate signed URL with content-disposition attachment (for direct B2/R2 access)
    const { presignGet } = require('../utils/b2');
    const signedUrl = await presignGet(key, 3600, {
      responseContentDisposition: `attachment; filename="${filename}"`,
      responseContentType: 'video/mp4'
    });

    // Redirect user to the signed URL
    res.redirect(signedUrl);

  } catch (error) {
    console.error('Download Redirect Error:', error.message);
    res.status(500).json({ success: false, message: `Download failed: ${error.message}` });
  }
};

const Video = require('../models/Video');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const crypto = require('crypto');
const { uploadFile, deleteFile, presignPut, publicUrl, uploadFilePath } = require('../utils/b2');
const { notifyFollowersNewVideo } = require('./notificationController');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

function computeChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(fileBuffer).digest('hex');
}

// Get video duration using a simple method (optional, non-blocking)
async function getVideoDuration(filePath) {
  try {
    // Use a lightweight method - just return 0 if we can't get it
    // This avoids heavy processing on EC2
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      // Try to get duration quickly, but don't block if it fails
      exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, 
        { timeout: 5000 }, 
        (error, stdout) => {
          if (error || !stdout) {
            resolve(0); // Return 0 if we can't get duration
          } else {
            const duration = parseFloat(stdout.trim());
            resolve(isNaN(duration) ? 0 : Math.round(duration));
          }
        }
      );
    });
  } catch (error) {
    return 0; // Return 0 if anything fails
  }
}

// Upload video + optional thumbnail - DIRECT UPLOAD TO B2, NO PROCESSING
// DISABLED: Use presigned URLs instead (createVideoFromB2) to prevent EC2 storage
exports.uploadVideo = async (req, res) => {
  // This endpoint is disabled - videos should use presigned URLs for direct B2 upload
  return res.status(410).json({ 
    success: false, 
    message: 'This endpoint is disabled. Please use presigned URLs for direct B2 uploads to prevent EC2 storage issues.' 
  });
};

// Presign endpoint for direct browser upload to B2 (bypasses EC2 storage)
exports.presignUpload = async (req, res) => {
  try {
    const { fileName, contentType, fileSize } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, message: 'fileName and contentType required' });
    }
    
    // Check file size (5GB = 5368709120 bytes)
    if (fileSize && fileSize > 5368709120) {
      return res.status(413).json({ 
        success: false, 
        message: 'File too large. Maximum size is 5GB' 
      });
    }
    
    const ts = Date.now();
    const key = `videos/${req.user.id}/${ts}_${fileName}`;
    // Extended expiration for large files (2 hours = 7200 seconds)
    const expiresIn = 7200;
    
    console.log(`📝 Generating presigned URL for: ${fileName} (${Math.round((fileSize || 0) / 1024 / 1024)}MB)`);
    console.log(`   Key: ${key}`);
    console.log(`   ContentType: ${contentType}`);
    
    const url = await presignPut(key, contentType, expiresIn);
    
    if (!url) {
      throw new Error('Failed to generate presigned URL - B2 configuration may be incorrect');
    }
    
    console.log(`✅ Presigned URL generated successfully`);
    console.log(`   URL: ${url.substring(0, 100)}...`);
    
    res.json({ 
      success: true, 
      url, 
      key, 
      publicUrl: publicUrl(key), 
      expiresIn 
    });
  } catch (e) {
    console.error('❌ Presign error:', e);
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to generate upload URL',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};

// Stream upload endpoint - receives file from browser and streams directly to B2
// This bypasses CORS issues and doesn't store files on EC2
exports.streamUploadToB2 = async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const videoFile = req.files.video;
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

    // Check file size (5GB = 5368709120 bytes)
    if (videoFile.size > 5368709120) {
      return res.status(413).json({ 
        success: false, 
        message: 'File too large. Maximum size is 5GB' 
      });
    }

    console.log(`📥 Streaming upload to B2: ${videoFile.name} (${Math.round(videoFile.size / 1024 / 1024)}MB)`);

    // Create B2 client
    const B2_BUCKET = process.env.B2_BUCKET;
    const B2_ENDPOINT = process.env.B2_ENDPOINT;
    const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID;
    const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY;

    if (!B2_BUCKET || !B2_ENDPOINT) {
      throw new Error('B2 storage not configured');
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: B2_ENDPOINT,
      credentials: {
        accessKeyId: B2_ACCESS_KEY_ID,
        secretAccessKey: B2_SECRET_ACCESS_KEY,
      },
      requestHandler: {
        requestTimeout: 7200000, // 2 hours
        connectionTimeout: 60000,
      },
    });

    // Generate key
    const ts = Date.now();
    const videoKey = `videos/${req.user.id}/${ts}_${videoFile.name}`;
    const videoCT = mime.lookup(videoFile.name) || 'video/mp4';

    // Stream file directly to B2 (no disk storage)
    // Handle both in-memory data and temp file paths
    let fileStream;
    if (videoFile.data) {
      // File is in memory
      fileStream = Readable.from(videoFile.data);
    } else if (videoFile.tempFilePath) {
      // File is on disk (temp file)
      const fs = require('fs');
      fileStream = fs.createReadStream(videoFile.tempFilePath);
    } else {
      // Fallback: use mv to temp and then stream
      const tmpDir = path.join(__dirname, '../../tmp');
      fs.mkdirSync(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, `stream_${ts}_${videoFile.name}`);
      await videoFile.mv(tmpPath);
      fileStream = fs.createReadStream(tmpPath);
    }
    
    console.log(`📤 Uploading to B2: ${videoKey} (${Math.round(videoFile.size / 1024 / 1024)}MB)`);
    
    // B2 requires ContentLength for stream uploads
    await s3.send(new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: videoKey,
      Body: fileStream,
      ContentType: videoCT,
      ContentLength: videoFile.size, // Required for B2 stream uploads
    }));
    
    // Clean up temp file if we created one
    if (videoFile.tempFilePath && fs.existsSync(videoFile.tempFilePath)) {
      try {
        fs.unlinkSync(videoFile.tempFilePath);
      } catch (e) {
        console.warn('Could not delete temp file:', e);
      }
    }

    const videoUrl = publicUrl(videoKey);
    console.log(`✅ Video uploaded to B2: ${videoUrl}`);

    // Handle thumbnail if provided
    let thumbnailUrl = '';
    if (req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail;
      const thumbKey = `thumbnails/${req.user.id}/${ts}_${thumbnailFile.name}`;
      const thumbCT = mime.lookup(thumbnailFile.name) || 'image/jpeg';
      
      let thumbStream;
      if (thumbnailFile.data) {
        thumbStream = Readable.from(thumbnailFile.data);
      } else if (thumbnailFile.tempFilePath) {
        thumbStream = fs.createReadStream(thumbnailFile.tempFilePath);
      } else {
        const tmpDir = path.join(__dirname, '../../tmp');
        fs.mkdirSync(tmpDir, { recursive: true });
        const tmpThumbPath = path.join(tmpDir, `thumb_stream_${ts}_${thumbnailFile.name}`);
        await thumbnailFile.mv(tmpThumbPath);
        thumbStream = fs.createReadStream(tmpThumbPath);
      }
      
      await s3.send(new PutObjectCommand({
        Bucket: B2_BUCKET,
        Key: thumbKey,
        Body: thumbStream,
        ContentType: thumbCT,
        ContentLength: thumbnailFile.size, // Required for B2 stream uploads
      }));
      
      thumbnailUrl = publicUrl(thumbKey);
      
      // Clean up temp thumbnail if created
      if (thumbnailFile.tempFilePath && fs.existsSync(thumbnailFile.tempFilePath)) {
        try {
          fs.unlinkSync(thumbnailFile.tempFilePath);
        } catch (e) {
          console.warn('Could not delete temp thumbnail:', e);
        }
      }
    }

    // Parse secondary genres
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

    // Create video record
    const video = await Video.create({
      title,
      description: description || ' ',
      videoUrl: videoUrl,
      hlsUrl: null,
      thumbnailUrl,
      subtitles: [],
      duration: 0,
      mainCategory: mainCategory || 'movies',
      primaryGenre: primaryGenre || 'action',
      secondaryGenres: parsedSecondaryGenres || [],
      subCategory: subCategory || null,
      category: primaryGenre || 'action',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visibility: visibility || 'public',
      user: req.user.id,
      originalName: videoFile.name,
      checksum: videoKey, // Use key as identifier
      processingStatus: 'completed',
      isPublished: true
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    console.log(`✅ Video ${video._id} created (streamed to B2, no EC2 storage)`);

    // Notify followers
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
      message: 'Video uploaded successfully! Your video is ready for playback immediately.'
    });
  } catch (error) {
    console.error('Stream upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload video',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create video record from B2 URL (after direct upload completes)
// This endpoint ONLY receives metadata - NO video files touch EC2
exports.createVideoFromB2 = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      mainCategory, 
      primaryGenre, 
      secondaryGenres, 
      subCategory,
      tags, 
      visibility,
      videoKey, // B2 key where video was uploaded
      videoUrl, // Public URL of uploaded video
      thumbnailKey, // Optional B2 key for thumbnail
      thumbnailUrl, // Optional thumbnail URL
      duration, // Optional duration in seconds
      fileSize, // File size in bytes
      originalName // Original filename
    } = req.body;

    if (!title || !videoKey || !videoUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'title, videoKey, and videoUrl are required' 
      });
    }

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

    // Compute checksum from metadata (optional, can skip for large files)
    const checksum = videoKey; // Use key as identifier

    // Create DB record - VIDEO IS ALREADY IN B2, NO PROCESSING NEEDED
    const video = await Video.create({
      title,
      description,
      videoUrl: videoUrl, // Direct video URL from B2 - ready immediately
      hlsUrl: null, // Not using HLS
      thumbnailUrl: thumbnailUrl || '',
      subtitles: [],
      duration: duration || 0,
      mainCategory: mainCategory || 'movies',
      primaryGenre: primaryGenre || 'action',
      secondaryGenres: parsedSecondaryGenres || [],
      subCategory: subCategory || null,
      category: primaryGenre || 'action', // Legacy field
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visibility: visibility || 'public',
      user: req.user.id,
      originalName: originalName || videoKey.split('/').pop(),
      checksum,
      processingStatus: 'completed', // Ready immediately - no processing
      isPublished: true // Publish immediately
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    console.log(`✅ Video ${video._id} created from B2 upload (no EC2 storage used)`);

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
      message: 'Video uploaded successfully! Your video is ready for playback immediately.'
    });
  } catch (error) {
    console.error('Create video from B2 error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create video record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

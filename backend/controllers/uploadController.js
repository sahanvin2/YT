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
    
    // Check file size (5GB max for presigned uploads)
    const maxSizeBytes = 5 * 1024 * 1024 * 1024; // 5GB
    if (fileSize && fileSize > maxSizeBytes) {
      return res.status(413).json({ 
        success: false, 
        message: `File too large. Maximum size is 5GB (${Math.round(maxSizeBytes / 1024 / 1024)}MB)` 
      });
    }
    
    const ts = Date.now();
    const key = `videos/${req.user.id}/${ts}_${fileName}`;
    // Extended expiration for large files (4 hours = 14400 seconds for very large uploads)
    const expiresIn = 14400;
    
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

    // Check file size (5GB max)
    const maxSizeBytes = 5 * 1024 * 1024 * 1024; // 5GB
    if (videoFile.size > maxSizeBytes) {
      return res.status(413).json({ 
        success: false, 
        message: `File too large. Maximum size is 5GB (${Math.round(maxSizeBytes / 1024 / 1024)}MB)` 
      });
    }

    console.log(`📥 Streaming upload to B2: ${videoFile.name} (${Math.round(videoFile.size / 1024 / 1024)}MB)`);

    // Create B2 client
    const B2_BUCKET = process.env.B2_BUCKET;
    const B2_ENDPOINT = process.env.B2_ENDPOINT;
    const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID;
    const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY;

    if (!B2_BUCKET || !B2_ENDPOINT || !B2_ACCESS_KEY_ID || !B2_SECRET_ACCESS_KEY) {
      throw new Error('B2 storage not configured (missing B2_BUCKET/B2_ENDPOINT/B2_ACCESS_KEY_ID/B2_SECRET_ACCESS_KEY)');
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

    // Generate key - accept ANY file format
    const ts = Date.now();
    // Preserve original filename and extension (supports any format: mp4, mkv, avi, mov, webm, etc.)
    const sanitizedFileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const videoKey = `videos/${req.user.id}/${ts}_${sanitizedFileName}`;
    // Detect content type from file extension or use generic binary
    const videoCT = mime.lookup(videoFile.name) || 'application/octet-stream';

    // Stream file directly to B2.
    // IMPORTANT: For stability we prefer streaming from tempFilePath (disk) instead of holding multi‑GB buffers in RAM.
    let fileStream;
    let contentLength = videoFile.size;
    if (videoFile.tempFilePath && fs.existsSync(videoFile.tempFilePath)) {
      fileStream = fs.createReadStream(videoFile.tempFilePath);
      try {
        contentLength = fs.statSync(videoFile.tempFilePath).size;
      } catch (e) {
        // keep fallback to provided size
      }
      console.log(`📤 File on disk, streaming to B2: ${videoKey} (${Math.round(contentLength / 1024 / 1024)}MB)`);
    } else if (videoFile.data) {
      fileStream = Readable.from(videoFile.data);
      contentLength = videoFile.data.length;
      console.log(`📤 File in memory, streaming to B2: ${videoKey} (${Math.round(contentLength / 1024 / 1024)}MB)`);
    } else {
      throw new Error('File data not available. Upload must provide tempFilePath or data.');
    }
    
    // Upload to B2 with verification
    console.log(`📤 Uploading to B2: ${videoKey} (${Math.round(videoFile.size / 1024 / 1024)}MB)`);
    
    try {
      // B2 requires ContentLength for stream uploads
      await s3.send(new PutObjectCommand({
        Bucket: B2_BUCKET,
        Key: videoKey,
        Body: fileStream,
        ContentType: videoCT,
        ContentLength: contentLength, // Required for B2 stream uploads
      }));
      
      // Verify upload succeeded by checking if file exists in B2
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      try {
        await s3.send(new HeadObjectCommand({
          Bucket: B2_BUCKET,
          Key: videoKey,
        }));
        console.log(`✅ Verified: File exists in B2: ${videoKey}`);
      } catch (verifyErr) {
        console.error(`❌ WARNING: Upload may have failed - cannot verify file in B2:`, verifyErr.message);
        // Don't throw - file might still be there, just not immediately available
      }
    } catch (uploadErr) {
      console.error(`❌ B2 upload failed:`, uploadErr);
      throw new Error(`Failed to upload to B2: ${uploadErr.message}`);
    }
    
    // IMMEDIATELY delete temp file if it exists (shouldn't happen, but safety check)
    if (videoFile.tempFilePath && fs.existsSync(videoFile.tempFilePath)) {
      try {
        fs.unlinkSync(videoFile.tempFilePath);
        console.log(`🗑️ Deleted temp file: ${videoFile.tempFilePath}`);
      } catch (e) {
        console.error(`❌ CRITICAL: Could not delete temp file: ${videoFile.tempFilePath}`, e);
        // This is critical - temp files filling up EC2 disk
      }
    }

    const videoUrl = publicUrl(videoKey);
    console.log(`✅ Video uploaded and verified in B2: ${videoUrl}`);

    // Handle thumbnail if provided (NO DISK STORAGE)
    let thumbnailUrl = '';
    if (req.files.thumbnail) {
      const thumbnailFile = req.files.thumbnail;
      const thumbKey = `thumbnails/${req.user.id}/${ts}_${thumbnailFile.name}`;
      const thumbCT = mime.lookup(thumbnailFile.name) || 'image/jpeg';
      
      let thumbStream;
      let thumbLength = thumbnailFile.size;
      if (thumbnailFile.tempFilePath && fs.existsSync(thumbnailFile.tempFilePath)) {
        thumbStream = fs.createReadStream(thumbnailFile.tempFilePath);
        try {
          thumbLength = fs.statSync(thumbnailFile.tempFilePath).size;
        } catch (e) {}
      } else if (thumbnailFile.data) {
        thumbStream = Readable.from(thumbnailFile.data);
        thumbLength = thumbnailFile.data.length;
      } else {
        throw new Error('Thumbnail data not available. Upload must provide tempFilePath or data.');
      }
      
      try {
        await s3.send(new PutObjectCommand({
          Bucket: B2_BUCKET,
          Key: thumbKey,
          Body: thumbStream,
          ContentType: thumbCT,
          ContentLength: thumbLength,
        }));
        thumbnailUrl = publicUrl(thumbKey);
        console.log(`✅ Thumbnail uploaded to B2: ${thumbKey}`);
      } catch (thumbErr) {
        console.error(`❌ Thumbnail upload failed:`, thumbErr);
        // Don't fail entire upload if thumbnail fails
      }
      
      // IMMEDIATELY delete temp thumbnail if exists
      if (thumbnailFile.tempFilePath && fs.existsSync(thumbnailFile.tempFilePath)) {
        try {
          fs.unlinkSync(thumbnailFile.tempFilePath);
          console.log(`🗑️ Deleted temp thumbnail: ${thumbnailFile.tempFilePath}`);
        } catch (e) {
          console.error(`❌ CRITICAL: Could not delete temp thumbnail:`, e);
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

    // Verify B2 upload before creating DB record
    // Double-check that file actually exists in B2
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    let b2Verified = false;
    try {
      await s3.send(new HeadObjectCommand({
        Bucket: B2_BUCKET,
        Key: videoKey,
      }));
      b2Verified = true;
      console.log(`✅ B2 upload verified: ${videoKey}`);
    } catch (verifyErr) {
      console.error(`❌ WARNING: Cannot verify file in B2 (may be eventual consistency):`, verifyErr.message);
      // Still create record - file might be there but not immediately available
    }

    // Create video record ONLY if we have a valid B2 URL
    if (!videoUrl || !videoUrl.includes('backblazeb2.com')) {
      throw new Error('Invalid B2 URL generated. Upload may have failed.');
    }

    // Processing disabled: store original file on B2 and publish immediately.
    // (No Redis queue, no HLS, no multi-quality variants.)
    const processingStatus = 'completed';
    const isPublished = true;

    const video = await Video.create({
      title,
      description: description || ' ',
      videoUrl: videoUrl, // Direct B2 URL (fallback)
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
      checksum: videoKey,
      processingStatus: processingStatus,
      isPublished: isPublished
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { videos: video._id } });

    console.log(`✅ Video ${video._id} created - B2 URL: ${videoUrl}`);
    console.log(`   B2 Verified: ${b2Verified ? 'YES' : 'PENDING (eventual consistency)'}`);
    console.log(`   Processing Status: ${processingStatus}`);
    
    // No queue / no worker / no HLS conversion.

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
      message: 'Video uploaded successfully! Your video is ready for playback.'
    });
    } catch (error) {
    console.error('❌ Stream upload error:', error);
    console.error('   Error stack:', error.stack);
    
    // Clean up any temp files that might have been created
    try {
      if (req.files?.video?.tempFilePath && fs.existsSync(req.files.video.tempFilePath)) {
        fs.unlinkSync(req.files.video.tempFilePath);
        console.log(`🗑️ Cleaned up temp file after error`);
      }
      if (req.files?.thumbnail?.tempFilePath && fs.existsSync(req.files.thumbnail.tempFilePath)) {
        fs.unlinkSync(req.files.thumbnail.tempFilePath);
        console.log(`🗑️ Cleaned up temp thumbnail after error`);
      }
    } catch (cleanupErr) {
      console.error('❌ CRITICAL: Could not clean up temp files:', cleanupErr);
    }
    
    // Provide user-friendly error message
    let errorMessage = 'Failed to upload video to B2 storage.';
    const rawMsg = error?.message || '';
    const awsCode = error?.name || error?.Code || error?.code;

    if (rawMsg.includes('B2 storage not configured')) {
      errorMessage = 'B2 storage is not configured on the server (missing env vars).';
    } else if (rawMsg.includes('Failed to upload to B2')) {
      errorMessage = `B2 upload failed (${awsCode || 'unknown'}). Check B2 credentials, bucket permissions, and server outbound internet.`;
    } else if (rawMsg.includes('AccessDenied') || rawMsg.includes('InvalidAccessKeyId') || rawMsg.includes('SignatureDoesNotMatch')) {
      errorMessage = `B2 credentials/permissions error (${awsCode || 'auth'}). Fix B2 keys and bucket access.`;
    } else if (rawMsg.includes('timeout') || rawMsg.includes('ETIMEDOUT') || rawMsg.includes('ECONNRESET')) {
      errorMessage = `Network timeout while uploading to B2 (${awsCode || 'network'}). Try again or check server network.`;
    } else if (rawMsg.includes('File data not available')) {
      errorMessage = 'File upload error. Please try again.';
    } else if (rawMsg) {
      errorMessage = rawMsg;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

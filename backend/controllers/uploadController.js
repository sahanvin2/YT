const Video = require('../models/Video');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const crypto = require('crypto');
const { uploadFile, deleteFile, presignPut, publicUrl, uploadFilePath } = require('../utils/b2');
const { notifyFollowersNewVideo } = require('./notificationController');

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
    const url = await presignPut(key, contentType, expiresIn);
    res.json({ 
      success: true, 
      url, 
      key, 
      publicUrl: publicUrl(key), 
      expiresIn 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
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

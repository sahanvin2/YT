const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const path = require('path');
const fs = require('fs');
const { uploadFilePath } = require('./b2');
const mime = require('mime-types');

// Configure ffmpeg paths
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

// Video quality presets (supports up to 4K)
const QUALITY_PRESETS = {
  '144': { width: 256, height: 144, bitrate: '200k', audioBitrate: '64k' },
  '240': { width: 426, height: 240, bitrate: '400k', audioBitrate: '64k' },
  '360': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  '480': { width: 854, height: 480, bitrate: '1200k', audioBitrate: '128k' },
  '720': { width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },
  '1080': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
  '1440': { width: 2560, height: 1440, bitrate: '8000k', audioBitrate: '192k' },
  '2160': { width: 3840, height: 2160, bitrate: '15000k', audioBitrate: '256k' } // 4K
};

/**
 * Get video resolution to determine available qualities
 */
async function getVideoResolution(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) return reject(new Error('No video stream found'));
      resolve({
        width: videoStream.width,
        height: videoStream.height
      });
    });
  });
}

/**
 * Transcode video to specific quality
 */
async function transcodeVideo(inputPath, outputPath, quality) {
  return new Promise((resolve, reject) => {
    const preset = QUALITY_PRESETS[quality];
    if (!preset) {
      return reject(new Error(`Invalid quality: ${quality}`));
    }

    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${preset.width}x${preset.height}`)
      .videoBitrate(preset.bitrate)
      .audioBitrate(preset.audioBitrate)
      .format('mp4')
      .outputOptions([
        '-preset medium',
        '-crf 23',
        '-movflags +faststart',
        '-pix_fmt yuv420p'
      ])
      .on('start', (commandLine) => {
        console.log(`Transcoding ${quality}p: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing ${quality}p: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`Transcoding ${quality}p completed`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error transcoding ${quality}p:`, err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Generate multiple quality variants of a video
 * @param {string} inputPath - Path to original video file
 * @param {string} userId - User ID for storage path
 * @param {string} videoId - Video ID for storage path
 * @param {number} originalHeight - Original video height
 * @returns {Promise<Array>} Array of variant objects with quality, url, and size
 */
async function generateVideoVariants(inputPath, userId, videoId, originalHeight) {
  const variants = [];
  const tmpDir = path.join(__dirname, '../../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Determine which qualities to generate based on original resolution
  const qualitiesToGenerate = [];
  const qualityOrder = ['144', '240', '360', '480', '720', '1080', '1440', '2160'];
  
  for (const quality of qualityOrder) {
    const preset = QUALITY_PRESETS[quality];
    if (preset.height <= originalHeight) {
      qualitiesToGenerate.push(quality);
    }
  }

  // Always include at least 144p and 240p if original is larger
  if (qualitiesToGenerate.length === 0) {
    qualitiesToGenerate.push('144', '240');
  }
  
  // If original is 4K or higher, also generate 1440p (2K) if not already included
  if (originalHeight >= 2160 && !qualitiesToGenerate.includes('1440')) {
    qualitiesToGenerate.push('1440');
  }

  console.log(`Generating variants for qualities: ${qualitiesToGenerate.join(', ')}`);

  // Generate each quality variant
  for (const quality of qualitiesToGenerate) {
    try {
      const timestamp = Date.now();
      const outputPath = path.join(tmpDir, `variant_${videoId}_${quality}_${timestamp}.mp4`);
      
      // Transcode video
      await transcodeVideo(inputPath, outputPath, quality);
      
      // Get file size
      const stats = fs.statSync(outputPath);
      const fileSize = stats.size;
      
      // Upload to B2
      const key = `videos/${userId}/${videoId}/variants/${quality}_${timestamp}.mp4`;
      const contentType = 'video/mp4';
      const url = await uploadFilePath(outputPath, key, contentType);
      
      // Add to variants array
      variants.push({
        quality: quality,
        url: url,
        size: fileSize,
        filePath: key
      });
      
      // Cleanup temp file
      fs.unlink(outputPath, () => {});
      
      console.log(`✓ Generated and uploaded ${quality}p variant`);
    } catch (error) {
      console.error(`Failed to generate ${quality}p variant:`, error.message);
      // Continue with other qualities even if one fails
    }
  }

  return variants;
}

module.exports = {
  generateVideoVariants,
  getVideoResolution,
  QUALITY_PRESETS
};


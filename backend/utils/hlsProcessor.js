const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const path = require('path');
const fs = require('fs');
const { uploadFilePath } = require('./b2');

// Configure FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * HLS Quality Presets for GPU encoding (NVIDIA RTX 2050)
 * Using 8-bit encoding (RTX 2050 doesn't support 10-bit efficiently)
 * Added 4K support for high-quality source videos
 */
const HLS_PRESETS = {
  '4K': {
    width: 3840,
    height: 2160,
    bitrate: '15000k',
    maxBitrate: '16000k',
    bufsize: '22500k',
    audioBitrate: '256k'
  },
  '1080p': {
    width: 1920,
    height: 1080,
    bitrate: '5000k',
    maxBitrate: '5350k',
    bufsize: '7500k',
    audioBitrate: '192k'
  },
  '720p': {
    width: 1280,
    height: 720,
    bitrate: '3000k',
    maxBitrate: '3200k',
    bufsize: '4500k',
    audioBitrate: '128k'
  },
  '480p': {
    width: 854,
    height: 480,
    bitrate: '1500k',
    maxBitrate: '1600k',
    bufsize: '2250k',
    audioBitrate: '128k'
  },
  '360p': {
    width: 640,
    height: 360,
    bitrate: '800k',
    maxBitrate: '856k',
    bufsize: '1200k',
    audioBitrate: '96k'
  },
  '240p': {
    width: 426,
    height: 240,
    bitrate: '500k',
    maxBitrate: '550k',
    bufsize: '750k',
    audioBitrate: '64k'
  },
  '144p': {
    width: 256,
    height: 144,
    bitrate: '300k',
    maxBitrate: '350k',
    bufsize: '450k',
    audioBitrate: '64k'
  }
};

/**
 * Get video information using ffprobe
 */
function getVideoInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        bitrate: metadata.format.bit_rate,
        hasAudio: !!audioStream,
        codec: videoStream?.codec_name
      });
    });
  });
}

/**
 * Determine which qualities to encode based on source resolution
 * Preserves original quality - if 1080p upload, start from 1080p
 * If 4K upload, add 4K quality and downscale from there
 */
function determineQualities(sourceWidth, sourceHeight) {
  const qualities = [];
  
  // Add 4K if source is 4K or higher
  if (sourceWidth >= 3840 && sourceHeight >= 2160) {
    qualities.push('4K');
  }
  
  // Add qualities from highest to lowest that source supports
  const allQualities = ['1080p', '720p', '480p', '360p', '240p', '144p'];
  
  for (const quality of allQualities) {
    const preset = HLS_PRESETS[quality];
    // Only encode if source is higher or equal resolution
    if (sourceWidth >= preset.width && sourceHeight >= preset.height) {
      qualities.push(quality);
    }
  }
  
  // Always include at least 360p for compatibility
  if (qualities.length === 0) {
    qualities.push('360p');
  }
  
  return qualities;
}

/**
 * Process single quality variant to HLS using GPU acceleration
 * @param {string} inputPath - Source video file path
 * @param {string} outputDir - Output directory for HLS files
 * @param {string} quality - Quality preset (e.g., '720p')
 * @param {function} onProgress - Progress callback
 */
function processQualityVariant(inputPath, outputDir, quality, onProgress) {
  return new Promise((resolve, reject) => {
    const preset = HLS_PRESETS[quality];
    if (!preset) {
      return reject(new Error(`Invalid quality preset: ${quality}`));
    }

    const qualityDir = path.join(outputDir, `hls_${quality}`);
    fs.mkdirSync(qualityDir, { recursive: true });

    const playlistPath = path.join(qualityDir, 'playlist.m3u8');
    const segmentPattern = path.join(qualityDir, 'segment_%03d.ts');

    console.log(`🎬 Processing ${quality} variant with GPU acceleration...`);

    // GPU-accelerated encoding using NVENC (NVIDIA)
    const command = ffmpeg(inputPath)
      // Video encoding with NVENC (H.264)
      .videoCodec('h264_nvenc')
      .outputOptions([
        // NVENC-specific options
        '-preset p4', // Medium quality/speed (p1=fastest, p7=slowest/best)
        '-tune hq', // High quality tuning
        '-profile:v high', // H.264 High Profile
        '-level 4.1',
        '-rc vbr', // Variable bitrate
        '-cq 23', // Constant quality (lower = better, 23 is good balance)
        '-b:v ' + preset.bitrate,
        '-maxrate ' + preset.maxBitrate,
        '-bufsize ' + preset.bufsize,
        '-pix_fmt yuv420p', // 8-bit color (RTX 2050 optimized)
        '-g 48', // GOP size (keyframe interval)
        '-keyint_min 48',
        '-sc_threshold 0',
        // Scale video with GPU-compatible filter
        `-vf scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`
      ])
      // Audio encoding
      .audioCodec('aac')
      .audioBitrate(preset.audioBitrate)
      .audioChannels(2)
      .audioFrequency(48000)
      // HLS options
      .outputOptions([
        '-f hls',
        '-hls_time 6', // 6-second segments (good balance)
        '-hls_list_size 0', // Keep all segments in playlist
        '-hls_segment_filename', segmentPattern,
        '-hls_flags independent_segments', // Better seeking
        '-hls_playlist_type vod' // Video on demand
      ])
      .output(playlistPath)
      .on('start', (commandLine) => {
        console.log(`📹 FFmpeg command: ${commandLine.substring(0, 150)}...`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          const percent = Math.round(progress.percent);
          if (onProgress) onProgress(quality, percent);
          if (percent % 10 === 0) {
            console.log(`   ${quality}: ${percent}% complete`);
          }
        }
      })
      .on('end', () => {
        console.log(`✅ ${quality} variant completed`);
        resolve({ quality, playlistPath, segmentDir: qualityDir });
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`❌ ${quality} encoding error:`, err.message);
        console.error('FFmpeg stderr:', stderr);
        reject(err);
      });

    command.run();
  });
}

/**
 * Create master playlist that references all quality variants
 */
function createMasterPlaylist(outputDir, variants) {
  const masterPath = path.join(outputDir, 'master.m3u8');
  
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
  
  // Sort variants by quality (highest first)
  const sortedVariants = [...variants].sort((a, b) => {
    const aHeight = HLS_PRESETS[a.quality]?.height || 0;
    const bHeight = HLS_PRESETS[b.quality]?.height || 0;
    return bHeight - aHeight;
  });

  for (const variant of sortedVariants) {
    const preset = HLS_PRESETS[variant.quality];
    if (!preset) continue;

    const bandwidth = parseInt(preset.bitrate) * 1000; // Convert to bits
    
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${preset.width}x${preset.height},NAME="${variant.quality}"\n`;
    content += `hls_${variant.quality}/playlist.m3u8\n\n`;
  }

  fs.writeFileSync(masterPath, content, 'utf-8');
  console.log(`📝 Master playlist created: ${masterPath}`);
  
  return masterPath;
}

/**
 * Upload HLS files to B2 storage
 */
async function uploadHLSToB2(localDir, videoId, userId) {
  const uploadedFiles = [];
  const failedUploads = [];
  
  console.log(`☁️  Uploading HLS files to B2...`);
  
  // Upload master playlist
  const masterPath = path.join(localDir, 'master.m3u8');
  if (fs.existsSync(masterPath)) {
    const masterKey = `videos/${userId}/${videoId}/master.m3u8`;
    try {
      const masterUrl = await uploadFilePath(masterPath, masterKey, 'application/vnd.apple.mpegurl');
      uploadedFiles.push({ type: 'master', url: masterUrl });
      console.log(`   ✓ Master playlist uploaded`);
    } catch (error) {
      console.error(`   ❌ Failed to upload master playlist:`, error.message);
      throw new Error(`Master playlist upload failed: ${error.message}`);
    }
  }

  // Collect all files to upload
  const filesToUpload = [];
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('hls_')) {
      const qualityDir = path.join(localDir, entry.name);
      const files = fs.readdirSync(qualityDir);
      
      for (const file of files) {
        const localFile = path.join(qualityDir, file);
        const b2Key = `videos/${userId}/${videoId}/${entry.name}/${file}`;
        const contentType = file.endsWith('.m3u8') 
          ? 'application/vnd.apple.mpegurl' 
          : 'video/MP2T';
        
        filesToUpload.push({ localFile, b2Key, contentType, quality: entry.name });
      }
    }
  }

  console.log(`   📦 Found ${filesToUpload.length} files to upload`);

  // Upload in parallel batches - optimized for speed + reliability
  // 8 files at once = good balance between speed and stability
  const BATCH_SIZE = 8; // Upload 8 files at once (balanced)
  let uploadedCount = 0;
  
  for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
    const batch = filesToUpload.slice(i, i + BATCH_SIZE);
    
    try {
      const uploadPromises = batch.map(async ({ localFile, b2Key, contentType }) => {
        try {
          const url = await uploadFilePath(localFile, b2Key, contentType);
          return { success: true, url };
        } catch (error) {
          console.error(`   ⚠️ Failed to upload ${path.basename(localFile)}:`, error.message);
          return { success: false, error: error.message, localFile, b2Key, contentType };
        }
      });
      
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;
      uploadedCount += successCount;

      // Track failed uploads so we can retry after the first pass.
      failedUploads.push(...results.filter(r => !r.success));
      
      uploadedFiles.push(...results.filter(r => r.success).map(r => ({ 
        type: 'segment', 
        url: r.url 
      })));
      
      const percentComplete = Math.round((uploadedCount / filesToUpload.length) * 100);
      console.log(`   ⬆️  Uploaded ${uploadedCount}/${filesToUpload.length} files (${percentComplete}%)`);
      
      if (successCount < batch.length) {
        const failedCount = batch.length - successCount;
        console.warn(`   ⚠️ ${failedCount} files failed in this batch`);
      }
      
      // Reduced delay for faster uploads while maintaining stability
      if (i + BATCH_SIZE < filesToUpload.length) {
        await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay (faster)
      }
    } catch (error) {
      console.error(`   ❌ Batch upload error:`, error.message);
      throw error;
    }
  }

  console.log(`✅ All HLS files uploaded (${uploadedFiles.length} total)`);

  // Second pass: retry anything that failed in the first pass.
  if (failedUploads.length > 0) {
    console.warn(`⚠️ Retrying ${failedUploads.length} failed uploads...`);

    const stillFailed = [];
    const RETRY_BATCH_SIZE = 5; // Smaller retry batch for better stability

    for (let i = 0; i < failedUploads.length; i += RETRY_BATCH_SIZE) {
      const batch = failedUploads.slice(i, i + RETRY_BATCH_SIZE);

      const retryResults = await Promise.all(batch.map(async (item) => {
        try {
          const url = await uploadFilePath(item.localFile, item.b2Key, item.contentType);
          return { success: true, url };
        } catch (error) {
          return { success: false, error: error.message, ...item };
        }
      }));

      const retrySuccess = retryResults.filter(r => r.success);
      const retryFailed = retryResults.filter(r => !r.success);

      uploadedFiles.push(...retrySuccess.map(r => ({ type: 'segment', url: r.url })));
      stillFailed.push(...retryFailed);

      console.log(`   🔁 Retry progress: recovered ${retrySuccess.length}/${batch.length}`);
      
      // Faster retry delays
      if (i + RETRY_BATCH_SIZE < failedUploads.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay for retries
      }
    }

    if (stillFailed.length > 0) {
      const playlistFails = stillFailed.filter(f => String(f.b2Key || '').endsWith('.m3u8'));
      const sample = stillFailed.slice(0, 5).map(f => ({ key: f.b2Key, error: f.error }));

      // If any playlist is missing, playback will definitely break.
      if (playlistFails.length > 0) {
        throw new Error(
          `HLS upload incomplete: ${stillFailed.length} files failed (including ${playlistFails.length} playlists). ` +
          `Sample: ${JSON.stringify(sample)}`
        );
      }

      // Even missing .ts segments can cause playback failures; fail fast to keep data consistent.
      throw new Error(
        `HLS upload incomplete: ${stillFailed.length} segment files failed to upload. ` +
        `Sample: ${JSON.stringify(sample)}`
      );
    }

    console.log('✅ All failed uploads recovered on retry');
  }
  
  return uploadedFiles;
}

/**
 * Main HLS processing function
 * @param {string} inputPath - Source video file path
 * @param {string} videoId - Video ID for storage organization
 * @param {string} userId - User ID for storage organization
 * @param {function} onProgress - Progress callback (quality, percent)
 */
async function processVideoToHLS(inputPath, videoId, userId, onProgress) {
  console.log(`\n🚀 Starting HLS processing for video ${videoId}`);
  console.log(`📁 Source: ${inputPath}`);
  
  try {
    // Get video information
    const videoInfo = await getVideoInfo(inputPath);
    console.log(`📹 Video info: ${videoInfo.width}x${videoInfo.height}, ${Math.round(videoInfo.duration)}s`);
    
    // Determine qualities to encode
    const qualities = determineQualities(videoInfo.width, videoInfo.height);
    console.log(`🎯 Encoding qualities: ${qualities.join(', ')}`);
    
    // Create temporary output directory
    const tmpDir = path.join(__dirname, '../../tmp');
    const outputDir = path.join(tmpDir, `hls_${videoId}`);
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Process each quality variant
    const variants = [];
    for (const quality of qualities) {
      const result = await processQualityVariant(
        inputPath, 
        outputDir, 
        quality, 
        onProgress
      );
      variants.push(result);
    }
    
    // Create master playlist
    const masterPlaylistPath = createMasterPlaylist(outputDir, variants);
    
    // Upload to B2
    const uploadedFiles = await uploadHLSToB2(outputDir, videoId, userId);
    
    // Get master playlist URL
    const masterUrl = uploadedFiles.find(f => f.type === 'master')?.url;
    
    // Cleanup local files
    console.log(`🧹 Cleaning up temporary files...`);
    fs.rmSync(outputDir, { recursive: true, force: true });
    
    console.log(`\n✅ HLS processing completed successfully!`);
    console.log(`🌐 Master playlist: ${masterUrl}`);
    
    return {
      success: true,
      hlsUrl: masterUrl,
      qualities: qualities,
      duration: Math.round(videoInfo.duration),
      variants: variants.map(v => ({
        quality: v.quality,
        resolution: `${HLS_PRESETS[v.quality].width}x${HLS_PRESETS[v.quality].height}`
      }))
    };
    
  } catch (error) {
    console.error(`❌ HLS processing failed:`, error);
    throw error;
  }
}

module.exports = {
  processVideoToHLS,
  getVideoInfo,
  HLS_PRESETS
};

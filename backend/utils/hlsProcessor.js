const ffmpeg = require('fluent-ffmpeg');
const ffmpegStaticPath = require('ffmpeg-static');
const ffprobeStaticPath = require('ffprobe-static').path;
const path = require('path');
const fs = require('fs');
const { uploadFilePath } = require('./b2');
const UploadTracker = require('./uploadTracker');
const { verifyHLSUpload } = require('./verifyUpload');

// Configure FFmpeg paths
// IMPORTANT: `ffmpeg-static` builds may not include NVENC on all platforms.
// For RTX GPU encoding on your local machine, set:
//   FFMPEG_PATH=C:\path\to\ffmpeg.exe   (must be an NVENC-enabled build)
//   FFPROBE_PATH=C:\path\to\ffprobe.exe
const configuredFfmpegPath = process.env.FFMPEG_PATH || process.env.FFMPEG_BINARY || ffmpegStaticPath;
const configuredFfprobePath = process.env.FFPROBE_PATH || process.env.FFPROBE_BINARY || ffprobeStaticPath;
if (configuredFfmpegPath) ffmpeg.setFfmpegPath(configuredFfmpegPath);
if (configuredFfprobePath) ffmpeg.setFfprobePath(configuredFfprobePath);

// Video encoder selection
// Default: NVENC (GPU) for fast local processing on NVIDIA cards like RTX 2050.
// Set VIDEO_ENCODER=libx264 to force CPU encoding.
const VIDEO_ENCODER = process.env.VIDEO_ENCODER || 'h264_nvenc';

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

    const isNvenc = String(VIDEO_ENCODER).toLowerCase().includes('nvenc');

    const videoOptions = isNvenc
      ? [
          // NVENC-specific options
          '-preset p2', // Fast encoding (p1=fastest, p7=slowest/best)
          '-tune hq',
          '-profile:v high',
          '-level 4.1',
          '-rc vbr',
          '-cq 23',
          '-b:v ' + preset.bitrate,
          '-maxrate ' + preset.maxBitrate,
          '-bufsize ' + preset.bufsize,
          '-pix_fmt yuv420p',
          '-g 48',
          '-keyint_min 48',
          '-sc_threshold 0',
          `-vf scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`
        ]
      : [
          // CPU fallback options
          '-preset veryfast',
          '-crf 23',
          '-profile:v high',
          '-level 4.1',
          '-pix_fmt yuv420p',
          '-g 48',
          '-keyint_min 48',
          '-sc_threshold 0',
          `-vf scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`
        ];

    // Encode (GPU NVENC by default; CPU optional)
    const command = ffmpeg(inputPath)
      .videoCodec(VIDEO_ENCODER)
      .outputOptions(videoOptions)
      // Audio encoding
      .audioCodec('aac')
      .audioBitrate(preset.audioBitrate)
      .audioChannels(2)
      .audioFrequency(48000)
      // HLS options
      .outputOptions([
        '-f hls',
        '-hls_time 4', // 4-second segments (faster processing)
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
  const startTime = Date.now();
  
  console.log(`☁️  Uploading HLS files to B2...`);
  console.log(`   🚀 Starting upload at ${new Date().toLocaleTimeString()}`);
  
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
  console.log(`   🚀 Starting upload at ${new Date().toLocaleTimeString()}`);

  // Create upload tracker
  const tracker = new UploadTracker(videoId, filesToUpload.length);

  // Upload in parallel batches - optimized for speed + reliability
  // Reduced batch size for better stability with large files
  const BATCH_SIZE = 5; // Upload 5 files at once (more stable for large videos)
  let uploadedCount = 0;
  let lastProgressTime = Date.now();
  let consecutiveFailures = 0;
  const STALL_TIMEOUT = 90000; // 90 seconds - detect stalled uploads faster
  const MAX_CONSECUTIVE_FAILURES = 3;
  
  // Heartbeat to show upload is alive
  const heartbeat = setInterval(() => {
    const elapsed = Date.now() - lastProgressTime;
    if (elapsed > 30000) { // 30 seconds without progress
      console.log(`   💓 Upload in progress... ${uploadedCount}/${filesToUpload.length} (${Math.round(uploadedCount/filesToUpload.length*100)}%)`);
    }
  }, 30000);
  
  try {
    for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
      const batch = filesToUpload.slice(i, i + BATCH_SIZE);
      
      // Detect stalled upload and adapt
      const timeSinceProgress = Date.now() - lastProgressTime;
      if (timeSinceProgress > STALL_TIMEOUT) {
        console.warn(`⚠️ Upload stalled for ${Math.round(timeSinceProgress/1000)}s. Reducing batch size and retrying...`);
        // Reduce batch size dramatically when stalled
        const smallBatch = batch.slice(0, 1); // Try just 1 file at a time
        i = i - BATCH_SIZE + 1; // Adjust index
        continue;
      }
      
      try {
        const uploadPromises = batch.map(async ({ localFile, b2Key, contentType }) => {
          try {
            // Timeout wrapper for individual file uploads (2 minutes per file)
            const uploadPromise = uploadFilePath(localFile, b2Key, contentType);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout after 120s')), 120000)
            );
            
            const url = await Promise.race([uploadPromise, timeoutPromise]);
            lastProgressTime = Date.now(); // Update progress time on success
            consecutiveFailures = 0; // Reset failure counter
            return { success: true, url };
          } catch (error) {
            console.error(`   ⚠️ Failed to upload ${path.basename(localFile)}:`, error.message);
            return { success: false, error: error.message, localFile, b2Key, contentType };
          }
        });
        
        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(r => r.success).length;
        uploadedCount += successCount;

        // Track consecutive failures
        if (successCount === 0) {
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.error(`❌ ${consecutiveFailures} consecutive batch failures. Pausing 5s before continuing...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            consecutiveFailures = 0; // Reset after pause
          }
        }

        // Track failed uploads so we can retry after the first pass.
        failedUploads.push(...results.filter(r => !r.success));
        
        uploadedFiles.push(...results.filter(r => r.success).map(r => ({ 
          type: 'segment', 
          url: r.url 
        })));
        
        const percentComplete = Math.round((uploadedCount / filesToUpload.length) * 100);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        // Update tracker
        const progress = tracker.updateProgress(uploadedCount, failedUploads.length);
        const eta = progress.estimatedRemaining ? `ETA: ${Math.round(progress.estimatedRemaining / 60)}m` : '';
        
        console.log(`   ⬆️  Uploaded ${uploadedCount}/${filesToUpload.length} files (${percentComplete}%) - ${elapsed}s elapsed ${eta}`);
        
        if (successCount < batch.length) {
          const failedCount = batch.length - successCount;
          console.warn(`   ⚠️ ${failedCount} files failed in this batch`);
        }
        
        // Reduced delay for faster uploads while maintaining stability
        if (i + BATCH_SIZE < filesToUpload.length) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay (even faster)
      }
      } catch (error) {
        console.error(`   ❌ Batch upload error:`, error.message);
        // Don't throw immediately - try to continue with remaining batches
    tracker.complete(); // Clean up progress file
        console.log(`   🔄 Continuing with next batch...`);
      }
    }
  } finally {
    clearInterval(heartbeat); // Stop heartbeat
  }

  const uploadDuration = Math.round((Date.now() - startTime) / 1000);
  console.log(`✅ All HLS files uploaded (${uploadedFiles.length} total) in ${uploadDuration}s`);

  // Verify upload completeness
  const expectedFiles = filesToUpload.length + 1; // +1 for master playlist
  const actualFiles = uploadedFiles.length;
  
  if (actualFiles < expectedFiles) {
    const missing = expectedFiles - actualFiles;
    console.warn(`⚠️ Upload verification: ${missing} files may be missing`);
    console.warn(`   Expected: ${expectedFiles}, Got: ${actualFiles}`);
    
    // If critical files missing, throw error
    if (missing > filesToUpload.length * 0.1) { // More than 10% missing
      throw new Error(`Too many files missing (${missing}/${expectedFiles}). Upload incomplete.`);
    }
  } else {
    console.log(`✅ Upload verification passed: All ${actualFiles} files confirmed`);
  }

  // Second pass: retry anything that failed in the first pass.
  if (failedUploads.length > 0) {
    console.warn(`⚠️ Retrying ${failedUploads.length} failed uploads...`);

    const stillFailed = [];
    const RETRY_BATCH_SIZE = 3; // Even smaller retry batch for maximum stability
    const MAX_RETRY_ATTEMPTS = 3; // Try each failed file up to 3 times

    for (let retryAttempt = 1; retryAttempt <= MAX_RETRY_ATTEMPTS; retryAttempt++) {
      console.log(`   🔁 Retry attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS}`);
      const toRetry = retryAttempt === 1 ? failedUploads : stillFailed;
      stillFailed.length = 0; // Clear for this attempt

      for (let i = 0; i < toRetry.length; i += RETRY_BATCH_SIZE) {
        const batch = toRetry.slice(i, i + RETRY_BATCH_SIZE);

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
        
        // Longer delay for retries to avoid rate limiting
        if (i + RETRY_BATCH_SIZE < toRetry.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay for retries
        }
      }

      // If all files uploaded successfully, break early
      if (stillFailed.length === 0) {
        console.log(`✅ All failed uploads recovered on attempt ${retryAttempt}`);
        break;
      }

      // Wait between full retry attempts
      if (retryAttempt < MAX_RETRY_ATTEMPTS && stillFailed.length > 0) {
        console.log(`   ⏳ Waiting 3 seconds before next retry attempt...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
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
    
    // Process quality variants in parallel for faster encoding.
    // IMPORTANT: Even with NVENC, some steps (demux/scale/audio) can be CPU-heavy on Windows.
    // Default to 1 to keep machines stable; override with HLS_PARALLEL_ENCODE=2 if you want.
    const variants = [];
    const PARALLEL_ENCODE = parseInt(process.env.HLS_PARALLEL_ENCODE || '1', 10) || 1;
    console.log(`⚙️  HLS_PARALLEL_ENCODE=${PARALLEL_ENCODE}`);
    
    for (let i = 0; i < qualities.length; i += PARALLEL_ENCODE) {
      const batch = qualities.slice(i, i + PARALLEL_ENCODE);
      console.log(`🔄 Encoding batch: ${batch.join(', ')}`);
      
      const batchResults = await Promise.all(
        batch.map(quality => 
          processQualityVariant(inputPath, outputDir, quality, onProgress)
        )
      );
      
      variants.push(...batchResults);
    }
    
    // Create master playlist
    const masterPlaylistPath = createMasterPlaylist(outputDir, variants);
    
    // Upload to B2
    const uploadedFiles = await uploadHLSToB2(outputDir, videoId, userId);
    
    // Get master playlist URL
    const masterUrl = uploadedFiles.find(f => f.type === 'master')?.url;
    
    // Verify upload completed successfully
    console.log(`\n🔍 Verifying upload integrity...`);
    const verification = await verifyHLSUpload(masterUrl, qualities);
    
    if (verification.status === 'failed') {
      throw new Error('Upload verification failed: Master playlist not accessible');
    } else if (verification.status === 'partial') {
      console.warn(`⚠️ Some variants may be missing, but upload can proceed`);
    }
    
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

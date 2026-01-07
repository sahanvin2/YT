/**
 * Local Video Processor & B2 Uploader
 * 
 * This tool allows you to:
 * 1. Process videos locally to HLS format
 * 2. Upload HLS segments directly to B2 storage
 * 3. Create database entries automatically
 * 4. Handle large files without website upload limits
 * 
 * Usage:
 *   node local-video-processor.js path/to/video.mp4 "Video Title" "description"
 *   node local-video-processor.js path/to/video.mp4 "Video Title" --batch
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

// FFmpeg configuration
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// B2 Configuration
const B2_BUCKET = process.env.B2_BUCKET;
const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID;
const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY;
const B2_PUBLIC_BASE = process.env.B2_PUBLIC_BASE;

// MongoDB Configuration
const MONGO_URI = process.env.MONGO_URI;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// S3 Client for B2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: B2_ENDPOINT,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
});

// RTX 2050 NVENC Optimized HLS Presets (8-bit hardware encoding)
// Tuned for speed + quality balance on RTX 2050
const HLS_PRESETS = {
  '1440p': {
    width: 2560,
    height: 1440,
    bitrate: '8000k',
    maxBitrate: '9000k',
    bufsize: '12000k',
    audioBitrate: '256k',
    crf: 21, // High quality
    preset: 'p4' // Medium speed/quality balance
  },
  '1080p': {
    width: 1920,
    height: 1080,
    bitrate: '5500k',
    maxBitrate: '6500k',
    bufsize: '8500k',
    audioBitrate: '192k',
    crf: 22, // High quality
    preset: 'p4'
  },
  '720p': {
    width: 1280,
    height: 720,
    bitrate: '3500k',
    maxBitrate: '4000k',
    bufsize: '5000k',
    audioBitrate: '128k',
    crf: 23, // Balanced
    preset: 'p3' // Faster for lower res
  },
  '480p': {
    width: 854,
    height: 480,
    bitrate: '1800k',
    maxBitrate: '2200k',
    bufsize: '2700k',
    audioBitrate: '128k',
    crf: 24,
    preset: 'p2' // Fast for low res
  },
  '360p': {
    width: 640,
    height: 360,
    bitrate: '1000k',
    maxBitrate: '1300k',
    bufsize: '1500k',
    audioBitrate: '96k',
    crf: 25,
    preset: 'p1' // Fastest for lowest res
  }
};

/**
 * Check for NVIDIA GPU and NVENC support
 */
async function checkNVENCSupport() {
  return new Promise((resolve) => {
    // Try to run ffmpeg with NVENC to test support
    const { exec } = require('child_process');
    exec(`"${ffmpegPath}" -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -c:v h264_nvenc -f null -`, 
      { timeout: 10000 }, 
      (error, stdout, stderr) => {
        if (error || stderr.includes('Unknown encoder')) {
          console.log('⚠️  NVENC not available - falling back to CPU encoding');
          resolve(false);
        } else {
          console.log('🚀 NVENC GPU encoding available!');
          resolve(true);
        }
      }
    );
  });
}
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
 * Process video to HLS format with RTX 2050 NVENC optimization
 */
async function processVideoToHLS(inputPath, outputDir, quality, onProgress, useNVENC = true) {
  const preset = HLS_PRESETS[quality];
  if (!preset) {
    throw new Error(`Unknown quality preset: ${quality}`);
  }

  const outputPath = path.join(outputDir, `hls_${quality}`, 'playlist.m3u8');
  const segmentDir = path.dirname(outputPath);
  
  // Create output directory
  fs.mkdirSync(segmentDir, { recursive: true });

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    // RTX 2050 NVENC Configuration (Hardware Encoding)
    if (useNVENC) {
      command
        .videoCodec('h264_nvenc') // NVIDIA hardware encoder
        .outputOptions([
          // RTX 2050 specific NVENC settings (8-bit optimized)
          `-preset ${preset.preset}`, // p1=fastest, p4=balanced, p6=slowest
          '-profile:v high', // H.264 High Profile (8-bit)
          '-level 4.1', // Broad compatibility
          '-pix_fmt yuv420p', // 8-bit color space (RTX 2050 optimized)
          '-rc vbr', // Variable bitrate for better quality
          `-cq ${preset.crf}`, // Constant quality (21=high, 25=medium)
          `-maxrate ${preset.maxBitrate}`,
          `-bufsize ${preset.bufsize}`,
          '-spatial-aq 1', // Spatial adaptive quantization
          '-temporal-aq 1', // Temporal adaptive quantization
          '-gpu 0' // Use first GPU
        ]);
      console.log(`   🚀 Using NVENC GPU encoding (RTX 2050 optimized) - ${quality}`);
    } else {
      // Fallback to optimized CPU encoding
      command
        .videoCodec('libx264')
        .outputOptions([
          '-preset medium', // CPU preset
          '-profile:v high',
          '-level 4.1',
          '-pix_fmt yuv420p',
          `-crf ${preset.crf + 2}`, // Slightly higher CRF for CPU
          `-maxrate ${preset.maxBitrate}`,
          `-bufsize ${preset.bufsize}`
        ]);
      console.log(`   💻 Using CPU encoding (fallback) - ${quality}`);
    }

    // Audio encoding (same for both)
    command
      .audioCodec('aac')
      .audioChannels(2)
      .audioFrequency(48000) // 48kHz for better quality
      .audioBitrate(preset.audioBitrate)
      .size(`${preset.width}x${preset.height}`)
      .outputOptions([
        // HLS specific settings
        '-start_number 0',
        '-hls_time 4', // 4-second segments (faster seeking)
        '-hls_list_size 0', // Keep all segments
        '-hls_segment_type mpegts', // MPEG-TS format
        '-hls_segment_filename', path.join(segmentDir, 'seg_%04d.ts'),
        '-hls_flags single_file', // Better compatibility
        '-f hls'
      ])
      .output(outputPath);

    // Progress tracking with speed info
    let lastPercent = 0;
    command.on('progress', (progress) => {
      const percent = Math.round(progress.percent || 0);
      const speed = progress.currentKbps || 0;
      const fps = progress.currentFps || 0;
      
      if (percent > lastPercent && percent % 5 === 0) { // Update every 5%
        console.log(`   📊 ${quality}: ${percent}% (${fps.toFixed(1)} fps, ${(speed/1000).toFixed(1)} Mbps)`);
        lastPercent = percent;
      }
      
      if (onProgress) {
        onProgress(quality, percent, { speed, fps });
      }
    });

    command.on('error', (err) => {
      // If NVENC fails, retry with CPU
      if (useNVENC && (err.message.includes('h264_nvenc') || err.message.includes('nvenc'))) {
        console.log(`   ⚠️  NVENC failed for ${quality}, retrying with CPU encoding...`);
        return processVideoToHLS(inputPath, outputDir, quality, onProgress, false)
          .then(resolve)
          .catch(reject);
      }
      reject(new Error(`FFmpeg error for ${quality}: ${err.message}`));
    });

    command.on('end', () => {
      resolve({
        quality,
        resolution: `${preset.width}x${preset.height}`,
        playlistPath: outputPath,
        segmentDir,
        encoder: useNVENC ? 'NVENC' : 'CPU'
      });
    });

    command.run();
  });
}

/**
 * Upload file to B2
 */
async function uploadToB2(filePath, key, contentType = 'application/octet-stream') {
  try {
    const fileContent = fs.readFileSync(filePath);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: contentType
    }));

    return `${B2_PUBLIC_BASE}/${key}`;
  } catch (error) {
    throw new Error(`Failed to upload ${key}: ${error.message}`);
  }
}

/**
 * Upload HLS folder to B2
 */
async function uploadHLSToB2(hlsDir, userId, videoId) {
  const uploadedFiles = [];
  
  // Get all files in HLS directory
  function getAllFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  const allFiles = getAllFiles(hlsDir);
  console.log(`📤 Uploading ${allFiles.length} HLS files to B2...`);

  // Upload files in batches
  const batchSize = 5;
  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    
    const uploadPromises = batch.map(async (filePath) => {
      const relativePath = path.relative(hlsDir, filePath);
      const b2Key = `hls/${userId}/${videoId}/${relativePath}`;
      
      let contentType = 'application/octet-stream';
      if (filePath.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (filePath.endsWith('.ts')) {
        contentType = 'video/mp2t';
      }

      const url = await uploadToB2(filePath, b2Key, contentType);
      console.log(`   ✅ ${relativePath} → B2`);
      
      return { type: 'segment', url };
    });

    const results = await Promise.all(uploadPromises);
    uploadedFiles.push(...results);
    
    console.log(`   📊 Progress: ${Math.min(i + batchSize, allFiles.length)}/${allFiles.length} files uploaded`);
  }

  return uploadedFiles;
}

/**
 * Create video database entry
 */
async function createVideoInDatabase(videoData) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const videosCollection = db.collection('videos');
    const usersCollection = db.collection('users');
    
    // Create video document
    const video = {
      ...videoData,
      user: new ObjectId(ADMIN_USER_ID),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: [],
      dislikes: [],
      comments: [],
      isPublished: true,
      processingStatus: 'completed',
      processingCompleted: new Date()
    };

    const result = await videosCollection.insertOne(video);
    console.log(`📊 Created database entry: ${result.insertedId}`);

    // Add to user's videos array
    await usersCollection.updateOne(
      { _id: new ObjectId(ADMIN_USER_ID) },
      { $push: { videos: result.insertedId } }
    );

    return result.insertedId;
  } finally {
    await client.close();
  }
}

/**
 * Main processing function
 */
async function processVideo(inputPath, title, description = '', options = {}) {
  try {
    console.log('🎬 Local Video Processor Starting...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📝 Title: ${title}`);
    
    // Validate input file
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Get video info
    console.log('📊 Analyzing video...');
    const videoInfo = await getVideoInfo(inputPath);
    console.log(`   Duration: ${Math.round(videoInfo.duration)}s`);
    console.log(`   Resolution: ${videoInfo.width}x${videoInfo.height}`);
    console.log(`   Codec: ${videoInfo.codec}`);
    console.log(`   Bitrate: ${videoInfo.bitrate ? Math.round(videoInfo.bitrate/1000) + 'kbps' : 'unknown'}`);

    // Check NVENC support
    const nvencAvailable = await checkNVENCSupport();
    
    // Generate unique IDs
    const videoId = new ObjectId().toString();
    const userId = ADMIN_USER_ID;
    const timestamp = Date.now();
    
    // Create temporary HLS directory
    const tmpDir = path.join(__dirname, 'tmp', 'hls_processing', videoId);
    fs.mkdirSync(tmpDir, { recursive: true });

    console.log('🎞️ Processing to HLS format...');
    
    // Smart quality selection based on input resolution
    const availableQualities = [];
    if (videoInfo.height >= 1440) availableQualities.push('1440p');
    if (videoInfo.height >= 1080) availableQualities.push('1080p');
    if (videoInfo.height >= 720) availableQualities.push('720p');
    if (videoInfo.height >= 480) availableQualities.push('480p');
    if (videoInfo.height >= 360) availableQualities.push('360p');
    
    // Always include at least 360p as fallback
    if (availableQualities.length === 0) {
      availableQualities.push('360p');
    }
    
    // For very high resolution, also create intermediate qualities
    if (videoInfo.height >= 2160) { // 4K source
      if (!availableQualities.includes('1440p')) availableQualities.splice(1, 0, '1440p');
    }

    console.log(`   Qualities: ${availableQualities.join(', ')}`);
    console.log(`   Encoder: ${nvencAvailable ? 'RTX 2050 NVENC (Hardware)' : 'CPU (Software)'}`);

    // Process each quality in parallel for NVENC (much faster)
    const variants = [];
    const startTime = Date.now();
    
    if (nvencAvailable && availableQualities.length <= 3) {
      // Parallel processing for NVENC (up to 3 streams on RTX 2050)
      console.log('🚀 Using parallel NVENC processing...');
      
      const processingPromises = availableQualities.map(async (quality) => {
        console.log(`🔄 Starting ${quality} (NVENC)...`);
        
        return await processVideoToHLS(
          inputPath, 
          tmpDir, 
          quality, 
          (qual, percent, stats) => {
            if (percent % 10 === 0) { // Update every 10%
              const fps = stats?.fps || 0;
              console.log(`   ⚡ ${qual}: ${Math.round(percent)}% (${fps.toFixed(1)} fps)`);
            }
          },
          true // Use NVENC
        );
      });
      
      const results = await Promise.all(processingPromises);
      variants.push(...results);
    } else {
      // Sequential processing (safer for CPU or many qualities)
      console.log('🔄 Using sequential processing...');
      
      for (const quality of availableQualities) {
        console.log(`🔄 Processing ${quality}...`);
        
        const variant = await processVideoToHLS(
          inputPath, 
          tmpDir, 
          quality, 
          (qual, percent, stats) => {
            const fps = stats?.fps || 0;
            const speed = stats?.speed || 0;
            process.stdout.write(`\r   ${qual}: ${Math.round(percent)}% (${fps.toFixed(1)} fps, ${(speed/1000).toFixed(1)} Mbps)`);
          },
          nvencAvailable
        );
        
        console.log(`\n   ✅ ${quality} completed (${variant.encoder})`);
        variants.push(variant);
      }
    }
    
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⚡ Processing completed in ${processingTime}s (${(videoInfo.duration / processingTime).toFixed(1)}x realtime)`);

    // Create master playlist
    console.log('📋 Creating master playlist...');
    const masterPlaylist = variants.map(variant => {
      const preset = HLS_PRESETS[variant.quality];
      return `#EXT-X-STREAM-INF:BANDWIDTH=${preset.bitrate.replace('k', '000')},RESOLUTION=${variant.resolution}\nhls_${variant.quality}/playlist.m3u8`;
    }).join('\n');

    const masterPlaylistPath = path.join(tmpDir, 'master.m3u8');
    fs.writeFileSync(masterPlaylistPath, `#EXTM3U\n#EXT-X-VERSION:3\n${masterPlaylist}\n`);

    // Upload to B2
    console.log('☁️ Uploading to B2 storage...');
    await uploadHLSToB2(tmpDir, userId, videoId);

    // Create database entry
    console.log('💾 Creating database entry...');
    const hlsUrl = `/api/hls/${userId}/${videoId}/master.m3u8`;
    
    const videoData = {
      title,
      description,
      videoUrl: hlsUrl,
      hlsUrl: hlsUrl,
      cdnUrl: hlsUrl,
      thumbnailUrl: '',
      subtitles: [],
      duration: Math.round(videoInfo.duration),
      mainCategory: options.category || 'movies',
      primaryGenre: options.genre || 'action',
      secondaryGenres: options.secondaryGenres || [],
      subCategory: options.subCategory || null,
      category: options.genre || 'action',
      tags: options.tags || [],
      visibility: options.visibility || 'public',
      originalName: path.basename(inputPath),
      checksum: crypto.randomBytes(16).toString('hex'),
      hlsEnabled: true,
      variants: variants.map(v => ({
        quality: parseInt(v.quality.replace(/[^0-9]/g, '')) || v.quality,
        url: `/api/hls/${userId}/${videoId}/hls_${v.quality}/playlist.m3u8`,
        resolution: v.resolution
      }))
    };

    const insertedId = await createVideoInDatabase(videoData);

    // Cleanup temporary files
    console.log('🧹 Cleaning up temporary files...');
    fs.rmSync(tmpDir, { recursive: true, force: true });

    console.log('🎉 Processing completed successfully!');
    console.log(`📺 Video ID: ${insertedId}`);
    console.log(`🔗 Watch URL: http://localhost:3000/watch/${insertedId}`);
    console.log(`📊 HLS Variants: ${variants.length} quality levels`);

    return {
      success: true,
      videoId: insertedId,
      hlsUrl,
      variants: variants.length,
      duration: Math.round(videoInfo.duration)
    };

  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('📖 Usage:');
    console.log('  node local-video-processor.js <video-file> <title> [description]');
    console.log('  node local-video-processor.js movie.mp4 "Awesome Movie" "Great description"');
    console.log('  node local-video-processor.js series.mkv "Episode 1" --category series --genre drama');
    process.exit(1);
  }

  const [inputPath, title, ...rest] = args;
  const description = rest.find(arg => !arg.startsWith('--')) || '';
  
  // Parse options
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      const key = rest[i].substring(2);
      const value = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true;
      options[key] = value;
      if (value !== true) i++; // Skip next argument if it was used as value
    }
  }

  processVideo(inputPath, title, description, options)
    .then(result => {
      console.log('\n✅ Success!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { processVideo };
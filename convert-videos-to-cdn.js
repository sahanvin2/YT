/**
 * Convert all video URLs to use CDN instead of proxy
 * This improves performance by serving directly from Bunny CDN
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./backend/models/Video');

const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL || 'https://Xclub.b-cdn.net';

console.log(`🌐 Using CDN: ${CDN_BASE}\n`);

async function convertVideosToCDN() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all videos with proxy URLs
    const videos = await Video.find({
      $or: [
        { videoUrl: /\/api\/hls\// },
        { hlsUrl: /\/api\/hls\// },
        { cdnUrl: /\/api\/hls\// }
      ]
    });

    console.log(`📹 Found ${videos.length} videos with proxy URLs\n`);

    let updated = 0;
    let skipped = 0;

    for (const video of videos) {
      try {
        let needsUpdate = false;
        
        // Convert videoUrl
        if (video.videoUrl && video.videoUrl.includes('/api/hls/')) {
          const match = video.videoUrl.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
          if (match) {
            const [, userId, videoId, file] = match;
            video.videoUrl = `${CDN_BASE}/videos/${userId}/${videoId}/${file}`;
            needsUpdate = true;
            console.log(`  📝 Updated videoUrl: ${video.title}`);
          }
        }

        // Convert hlsUrl
        if (video.hlsUrl && video.hlsUrl.includes('/api/hls/')) {
          const match = video.hlsUrl.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
          if (match) {
            const [, userId, videoId, file] = match;
            video.hlsUrl = `${CDN_BASE}/videos/${userId}/${videoId}/${file}`;
            needsUpdate = true;
          }
        }

        // Convert cdnUrl
        if (video.cdnUrl && video.cdnUrl.includes('/api/hls/')) {
          const match = video.cdnUrl.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
          if (match) {
            const [, userId, videoId, file] = match;
            video.cdnUrl = `${CDN_BASE}/videos/${userId}/${videoId}/${file}`;
            needsUpdate = true;
          }
        }

        // Convert variant URLs
        if (video.variants && Array.isArray(video.variants)) {
          for (const variant of video.variants) {
            if (variant.url && variant.url.includes('/api/hls/')) {
              const match = variant.url.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
              if (match) {
                const [, userId, videoId, file] = match;
                variant.url = `${CDN_BASE}/videos/${userId}/${videoId}/${file}`;
                needsUpdate = true;
              }
            }
            if (variant.cdnUrl && variant.cdnUrl.includes('/api/hls/')) {
              const match = variant.cdnUrl.match(/\/api\/hls\/([^\/]+)\/([^\/]+)\/(.+)/);
              if (match) {
                const [, userId, videoId, file] = match;
                variant.cdnUrl = `${CDN_BASE}/videos/${userId}/${videoId}/${file}`;
                needsUpdate = true;
              }
            }
          }
        }

        if (needsUpdate) {
          await video.save();
          updated++;
          console.log(`  ✅ ${video.title}`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`  ❌ Error updating ${video.title}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated} videos`);
    console.log(`   ⏭️  Skipped: ${skipped} videos`);
    console.log(`\n🎉 All videos now use CDN URLs!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

convertVideosToCDN();

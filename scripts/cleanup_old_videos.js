/**
 * Safe video cleanup script for B2 + MongoDB
 * 
 * Usage:
 *   DRY RUN (preview):  node scripts/cleanup_old_videos.js
 *   EXECUTE deletion:   node scripts/cleanup_old_videos.js --execute
 * 
 * What it does:
 * 1. Finds all videos in MongoDB that don't have HLS URLs
 * 2. Lists their B2 file keys (videos/thumbnails)
 * 3. In DRY RUN: shows what would be deleted
 * 4. In EXECUTE mode: deletes from B2 then MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const Video = require('../backend/models/Video');

const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-005.backblazeb2.com',
  region: process.env.B2_REGION || 'us-west-005',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY
  }
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'movia-prod';
const EXECUTE = process.argv.includes('--execute');

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find videos without HLS URLs (old non-HLS videos)
    const oldVideos = await Video.find({
      $or: [
        { hlsUrl: { $exists: false } },
        { hlsUrl: null },
        { hlsUrl: '' }
      ]
    }).select('_id title user videoUrl thumbnailUrl filePath path url createdAt');

    if (oldVideos.length === 0) {
      console.log('✅ No old videos found. All videos have HLS URLs.');
      process.exit(0);
    }

    console.log(`📊 Found ${oldVideos.length} old videos without HLS URLs\n`);

    // Build list of B2 keys to delete
    const keysToDelete = [];
    const videoIdsToDelete = [];

    for (const video of oldVideos) {
      const userId = video.user;
      const videoId = video._id.toString();

      // Extract keys from various URL formats
      const urls = [
        video.videoUrl,
        video.filePath,
        video.path,
        video.url,
        video.thumbnailUrl
      ].filter(Boolean);

      for (const urlStr of urls) {
        if (typeof urlStr === 'string') {
          // Extract B2 key from URL
          const match = urlStr.match(/movia-prod\/(.+)$/);
          if (match) {
            keysToDelete.push(match[1]);
          }
        }
      }

      // Also add potential video directory (videos/userId/videoId/*)
      if (userId && videoId) {
        keysToDelete.push(`videos/${userId}/${videoId}/`);
        keysToDelete.push(`thumbnails/${userId}/`);
      }

      videoIdsToDelete.push(videoId);

      console.log(`📹 ${video.title || 'Untitled'}`);
      console.log(`   ID: ${videoId}`);
      console.log(`   Created: ${video.createdAt}`);
      console.log(`   Video URL: ${video.videoUrl || 'N/A'}`);
      console.log(`   Thumbnail: ${video.thumbnailUrl || 'N/A'}\n`);
    }

    // List all objects in B2 for these videos (recursively)
    console.log(`\n🔍 Scanning B2 bucket for objects to delete...`);
    const allB2Objects = [];

    for (const video of oldVideos) {
      const userId = video.user;
      const videoId = video._id.toString();

      if (userId && videoId) {
        // List objects under videos/userId/videoId/
        const videoPrefix = `videos/${userId}/${videoId}/`;
        let continuationToken;

        do {
          const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: videoPrefix,
            ContinuationToken: continuationToken
          });

          const response = await s3Client.send(listCommand);

          if (response.Contents) {
            allB2Objects.push(...response.Contents.map(obj => obj.Key));
          }

          continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        // List thumbnails
        const thumbPrefix = `thumbnails/${userId}/${videoId}`;
        continuationToken = undefined;

        do {
          const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: thumbPrefix,
            ContinuationToken: continuationToken
          });

          const response = await s3Client.send(listCommand);

          if (response.Contents) {
            allB2Objects.push(...response.Contents.map(obj => obj.Key));
          }

          continuationToken = response.NextContinuationToken;
        } while (continuationToken);
      }
    }

    const uniqueKeys = [...new Set(allB2Objects)];
    console.log(`📦 Found ${uniqueKeys.length} objects in B2 to delete\n`);

    if (uniqueKeys.length > 0) {
      console.log('Sample B2 objects:');
      uniqueKeys.slice(0, 10).forEach(key => console.log(`   - ${key}`));
      if (uniqueKeys.length > 10) {
        console.log(`   ... and ${uniqueKeys.length - 10} more`);
      }
      console.log('');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 SUMMARY`);
    console.log(`   MongoDB videos to delete: ${videoIdsToDelete.length}`);
    console.log(`   B2 objects to delete: ${uniqueKeys.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!EXECUTE) {
      console.log('🔒 DRY RUN MODE - No changes made');
      console.log('💡 To execute deletion, run:');
      console.log('   node scripts/cleanup_old_videos.js --execute\n');
      process.exit(0);
    }

    // EXECUTE MODE
    console.log('⚠️  EXECUTE MODE - Deleting...\n');

    // Delete from B2 in batches of 1000 (B2 limit)
    if (uniqueKeys.length > 0) {
      console.log('🗑️  Deleting from B2...');
      const batchSize = 1000;

      for (let i = 0; i < uniqueKeys.length; i += batchSize) {
        const batch = uniqueKeys.slice(i, i + batchSize);

        const deleteCommand = new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: batch.map(Key => ({ Key })),
            Quiet: true
          }
        });

        await s3Client.send(deleteCommand);
        console.log(`   ✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} objects)`);
      }

      console.log(`✅ Deleted ${uniqueKeys.length} objects from B2\n`);
    }

    // Delete from MongoDB
    if (videoIdsToDelete.length > 0) {
      console.log('🗑️  Deleting from MongoDB...');
      const result = await Video.deleteMany({
        _id: { $in: videoIdsToDelete }
      });

      console.log(`✅ Deleted ${result.deletedCount} videos from MongoDB\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CLEANUP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

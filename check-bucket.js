const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

const b2 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

async function checkBucket() {
  try {
    console.log('🔍 Checking B2 Bucket:', process.env.B2_BUCKET);
    console.log('🌐 CDN Base:', process.env.CDN_BASE);
    console.log('');

    // List HLS folders (recent videos)
    const hlsFolders = await b2.send(new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET,
      Prefix: 'hls/',
      Delimiter: '/',
      MaxKeys: 20
    }));

    console.log('📁 Recent HLS Video Folders:');
    console.log('='.repeat(60));
    
    if (hlsFolders.CommonPrefixes && hlsFolders.CommonPrefixes.length > 0) {
      for (const folder of hlsFolders.CommonPrefixes.slice(0, 10)) {
        const videoId = folder.Prefix.replace('hls/', '').replace('/', '');
        console.log(`\n✅ Video ID: ${videoId}`);
        console.log(`   📺 Master Playlist: ${process.env.CDN_BASE}/hls/${videoId}/master.m3u8`);
        
        // Check what files are inside
        const files = await b2.send(new ListObjectsV2Command({
          Bucket: process.env.B2_BUCKET,
          Prefix: `hls/${videoId}/`,
          MaxKeys: 10
        }));
        
        const qualities = new Set();
        files.Contents.forEach(file => {
          const match = file.Key.match(/hls\/[^/]+\/(\d+p)\//);
          if (match) qualities.add(match[1]);
        });
        
        if (qualities.size > 0) {
          console.log(`   🎬 Qualities: ${Array.from(qualities).join(', ')}`);
        }
        console.log(`   📦 Files: ${files.Contents.length}`);
      }
    } else {
      console.log('⚠️  No HLS videos found yet');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Bucket Statistics:');
    
    // Count total objects
    const allObjects = await b2.send(new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET,
      MaxKeys: 1000
    }));
    
    let totalSize = 0;
    let hlsCount = 0;
    let videoCount = 0;
    let thumbnailCount = 0;
    
    allObjects.Contents.forEach(obj => {
      totalSize += obj.Size;
      if (obj.Key.startsWith('hls/')) hlsCount++;
      if (obj.Key.startsWith('videos/')) videoCount++;
      if (obj.Key.startsWith('thumbnails/')) thumbnailCount++;
    });
    
    console.log(`   Total Objects: ${allObjects.Contents.length}`);
    console.log(`   HLS Files: ${hlsCount}`);
    console.log(`   Old Videos: ${videoCount}`);
    console.log(`   Thumbnails: ${thumbnailCount}`);
    console.log(`   Total Size: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBucket();

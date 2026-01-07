/**
 * Quick Test for RTX 2050 Video Processor
 * Creates a test video and processes it to verify NVENC performance
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { processVideo } = require('./local-video-processor');
const ffmpegPath = require('ffmpeg-static');

async function createTestVideo() {
  console.log('🎬 Creating test video...');
  
  const testVideoPath = path.join(__dirname, 'test-video.mp4');
  
  // Create a 30-second test video with some motion
  const cmd = `"${ffmpegPath}" -f lavfi -i "testsrc2=duration=30:size=1920x1080:rate=30,format=yuv420p" -f lavfi -i "sine=frequency=1000:duration=30" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y "${testVideoPath}"`;
  
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log('✅ Test video created (30s, 1080p)');
        resolve(testVideoPath);
      }
    });
  });
}

async function testRTX2050Processing() {
  try {
    console.log('🧪 RTX 2050 NVENC Video Processing Test');
    console.log('═'.repeat(50));
    
    // Create test video
    const testVideoPath = await createTestVideo();
    
    // Get file size
    const stats = fs.statSync(testVideoPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`📁 Test video: ${fileSizeMB}MB`);
    
    // Process with our optimized system
    console.log('\n🚀 Starting RTX 2050 NVENC processing...');
    const startTime = Date.now();
    
    const result = await processVideo(
      testVideoPath, 
      "RTX 2050 Test Video", 
      "Testing NVENC hardware encoding performance"
    );
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log('\n🎉 RTX 2050 Test Results:');
    console.log('═'.repeat(40));
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(1)}s`);
    console.log(`⚡ Processing speed: ${(30 / totalTime).toFixed(1)}x realtime`);
    console.log(`📊 HLS variants created: ${result.variants}`);
    console.log(`🎥 Video duration: ${result.duration}s`);
    console.log(`🔗 Watch URL: http://localhost:3000/watch/${result.videoId}`);
    
    // Performance analysis
    if (totalTime < 15) {
      console.log('\n🚀 EXCELLENT: Your RTX 2050 is performing optimally!');
    } else if (totalTime < 30) {
      console.log('\n✅ GOOD: RTX 2050 working well, faster than CPU');
    } else {
      console.log('\n⚠️  SLOW: May be using CPU fallback - check NVIDIA drivers');
    }
    
    // Cleanup test file
    try {
      fs.unlinkSync(testVideoPath);
      console.log('🧹 Cleaned up test video');
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  testRTX2050Processing()
    .then(() => {
      console.log('\n✅ RTX 2050 test completed successfully!');
      console.log('💡 Your system is ready for ultra-fast video processing.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testRTX2050Processing };
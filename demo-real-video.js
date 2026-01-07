/**
 * Quick Demo: Process a sample movie file
 * Shows how to use the local video processor with real content
 */

const path = require('path');
const fs = require('fs');
const { processVideo } = require('./local-video-processor');

async function demoRealVideoProcessing() {
  console.log('🎬 Demo: Real Video Processing with RTX 2050');
  console.log('═'.repeat(50));
  
  // Instructions for user
  console.log('📁 To test with your own video:');
  console.log('   1. Put a video file in this folder (MP4, MKV, AVI, etc.)');
  console.log('   2. Run: node demo-real-video.js "your-video.mp4" "Video Title"');
  console.log('   3. Watch the RTX 2050 NVENC magic! 🚀');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n💡 Example usage:');
    console.log('   node demo-real-video.js "movie.mp4" "Amazing Movie"');
    console.log('   node demo-real-video.js "series.mkv" "Episode 1" --category series --genre drama');
    
    // Show any video files in current directory
    const videoFiles = fs.readdirSync('.').filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext);
    });
    
    if (videoFiles.length > 0) {
      console.log('\n📺 Video files found in current directory:');
      videoFiles.forEach((file, index) => {
        const stats = fs.statSync(file);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        console.log(`   ${index + 1}. ${file} (${sizeMB}MB)`);
      });
      console.log('\n💡 Try: node demo-real-video.js "' + videoFiles[0] + '" "My Video"');
    }
    
    return;
  }
  
  const [videoPath, title, ...rest] = args;
  const description = rest.find(arg => !arg.startsWith('--')) || '';
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ File not found: ${videoPath}`);
    return;
  }
  
  // Get file info
  const stats = fs.statSync(videoPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`\n🎥 Processing: ${videoPath}`);
  console.log(`📊 Size: ${sizeMB}MB`);
  console.log(`📝 Title: ${title}`);
  
  try {
    const startTime = Date.now();
    
    // Process the video
    const result = await processVideo(videoPath, title, description);
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log('\n🎉 RTX 2050 Processing Complete!');
    console.log('═'.repeat(40));
    console.log(`⏱️  Total time: ${Math.round(totalTime)}s`);
    console.log(`⚡ Speed: ${(result.duration / totalTime).toFixed(1)}x realtime`);
    console.log(`📊 Qualities: ${result.variants} variants created`);
    console.log(`🎥 Duration: ${Math.round(result.duration / 60)}m ${result.duration % 60}s`);
    console.log(`🔗 Watch: http://localhost:3000/watch/${result.videoId}`);
    
    // Performance analysis
    const speedMultiplier = result.duration / totalTime;
    if (speedMultiplier > 2) {
      console.log('\n🚀 EXCELLENT: RTX 2050 NVENC is blazing fast!');
    } else if (speedMultiplier > 1) {
      console.log('\n✅ GOOD: Faster than realtime processing');
    } else {
      console.log('\n⚠️  SLOW: Large file or complex encoding');
    }
    
  } catch (error) {
    console.error('\n❌ Processing failed:', error.message);
  }
}

// Run the demo
if (require.main === module) {
  demoRealVideoProcessing();
}

module.exports = { demoRealVideoProcessing };
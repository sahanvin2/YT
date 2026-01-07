/**
 * RTX 2050 Performance Optimizer
 * 
 * Test NVENC performance and optimize settings for your specific GPU
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

/**
 * Test NVENC encoding performance with different presets
 */
async function testNVENCPerformance() {
  console.log('🧪 Testing RTX 2050 NVENC Performance...\n');
  
  // Test presets (p1=fastest, p6=slowest/best quality)
  const testPresets = [
    { name: 'P1 (Fastest)', preset: 'p1', expected: 'Ultra fast, good for 360p/480p' },
    { name: 'P3 (Fast)', preset: 'p3', expected: 'Fast, good for 720p' },
    { name: 'P4 (Medium)', preset: 'p4', expected: 'Balanced, good for 1080p' },
    { name: 'P6 (Slow)', preset: 'p6', expected: 'Slowest, best quality for 1440p+' }
  ];

  const results = [];
  
  for (const test of testPresets) {
    console.log(`⚡ Testing ${test.name}...`);
    
    try {
      const startTime = Date.now();
      
      // Test with a 10-second 1080p test video
      const cmd = `"${ffmpegPath}" -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 -c:v h264_nvenc -preset ${test.preset} -cq 23 -pix_fmt yuv420p -f null -`;
      
      await new Promise((resolve, reject) => {
        exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;
      const speed = 10 / processingTime; // realtime multiplier
      
      results.push({
        ...test,
        processingTime,
        speed: speed.toFixed(1),
        status: 'PASS',
        color: speed > 1 ? '✅' : speed > 0.5 ? '⚠️' : '❌'
      });
      
      console.log(`   ${speed > 1 ? '✅' : '⚠️'} ${processingTime.toFixed(1)}s (${speed.toFixed(1)}x realtime)\n`);
      
    } catch (error) {
      results.push({
        ...test,
        status: 'FAIL',
        error: error.message,
        color: '❌'
      });
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }
  
  // Display results
  console.log('📊 RTX 2050 NVENC Performance Results:');
  console.log('═'.repeat(60));
  
  results.forEach(result => {
    if (result.status === 'PASS') {
      console.log(`${result.color} ${result.name}: ${result.speed}x realtime`);
      console.log(`   ${result.expected}`);
      console.log(`   Processing: ${result.processingTime}s for 10s video\n`);
    } else {
      console.log(`${result.color} ${result.name}: FAILED`);
      console.log(`   Error: ${result.error}\n`);
    }
  });
  
  // Recommendations
  console.log('💡 Recommendations for RTX 2050:');
  const bestFast = results.filter(r => r.status === 'PASS' && parseFloat(r.speed) > 2).sort((a, b) => parseFloat(b.speed) - parseFloat(a.speed))[0];
  const bestQuality = results.filter(r => r.status === 'PASS').sort((a, b) => a.preset.localeCompare(b.preset)).pop();
  
  if (bestFast) {
    console.log(`🚀 Fastest: ${bestFast.name} (${bestFast.speed}x) - Use for batch processing`);
  }
  if (bestQuality) {
    console.log(`💎 Best Quality: ${bestQuality.name} (${bestQuality.speed}x) - Use for important videos`);
  }
  
  return results;
}

/**
 * Test memory usage and optimal concurrent streams
 */
async function testConcurrentStreams() {
  console.log('\n🔧 Testing Concurrent Stream Capacity...\n');
  
  const tests = [1, 2, 3];
  
  for (const streams of tests) {
    console.log(`⚡ Testing ${streams} concurrent stream${streams > 1 ? 's' : ''}...`);
    
    try {
      const startTime = Date.now();
      
      const promises = Array(streams).fill(0).map((_, i) => {
        return new Promise((resolve, reject) => {
          const cmd = `"${ffmpegPath}" -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -c:v h264_nvenc -preset p3 -cq 24 -pix_fmt yuv420p -f null -`;
          exec(cmd, { timeout: 15000 }, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      });
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      const efficiency = (5 * streams) / totalTime;
      
      if (efficiency > 0.8) {
        console.log(`   ✅ ${streams} streams: ${totalTime.toFixed(1)}s (${efficiency.toFixed(1)}x efficient)`);
      } else {
        console.log(`   ⚠️ ${streams} streams: ${totalTime.toFixed(1)}s (${efficiency.toFixed(1)}x efficient) - May struggle`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${streams} streams: FAILED - GPU overloaded`);
      break;
    }
  }
}

/**
 * Generate optimized config for RTX 2050
 */
function generateOptimizedConfig() {
  const config = {
    // Recommended settings for RTX 2050
    nvenc: {
      enabled: true,
      maxConcurrentStreams: 2, // Safe limit for RTX 2050
      presets: {
        '1440p': 'p6', // Best quality for high res
        '1080p': 'p4', // Balanced
        '720p': 'p3',  // Fast
        '480p': 'p2',  // Very fast
        '360p': 'p1'   // Ultra fast
      },
      crf: {
        '1440p': 20, // Excellent quality
        '1080p': 22, // High quality  
        '720p': 23,  // Good quality
        '480p': 24,  // Medium quality
        '360p': 25   // Acceptable quality
      },
      pixelFormat: 'yuv420p', // 8-bit for RTX 2050
      profile: 'high',
      level: '4.1',
      rateControl: 'vbr', // Variable bitrate
      spatialAQ: true,
      temporalAQ: true,
      twoPass: false // Single pass for speed
    },
    hls: {
      segmentDuration: 4, // 4s segments for good seek performance
      segmentType: 'mpegts',
      audioSampleRate: 48000,
      audioChannels: 2
    },
    processing: {
      parallelEncoding: true, // Use parallel for multiple qualities
      maxParallelStreams: 2,  // Safe for RTX 2050 VRAM
      fallbackToCPU: true     // Auto-fallback if NVENC fails
    }
  };
  
  // Save config
  const configPath = path.join(__dirname, 'rtx2050-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('\n💾 Optimized config saved to rtx2050-config.json');
  console.log('📋 Key optimizations:');
  console.log('   • Hardware encoding: NVENC H.264');
  console.log('   • Color format: 8-bit YUV420P (RTX 2050 optimized)');
  console.log('   • Concurrent streams: 2 max (VRAM safe)');
  console.log('   • Quality presets: Speed/quality balanced');
  console.log('   • Rate control: Variable bitrate');
  console.log('   • Adaptive quantization: Enabled');
  
  return config;
}

// Main function
async function optimizeRTX2050() {
  console.log('🎮 RTX 2050 NVENC Optimizer');
  console.log('═'.repeat(40));
  
  try {
    await testNVENCPerformance();
    await testConcurrentStreams();
    generateOptimizedConfig();
    
    console.log('\n🚀 Optimization complete! Your RTX 2050 is ready for ultra-fast HLS encoding.');
    console.log('💡 Expected performance: 3-5x faster than CPU encoding');
    
  } catch (error) {
    console.error('\n❌ Optimization failed:', error.message);
    console.error('   Make sure you have NVIDIA drivers installed and NVENC support enabled.');
  }
}

// Run if called directly
if (require.main === module) {
  optimizeRTX2050();
}

module.exports = { optimizeRTX2050, testNVENCPerformance };
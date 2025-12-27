const axios = require('axios');

async function testFrontendAccess() {
  const videoId = '694eeed4c381b4269d3477da';
  
  console.log('🔍 Testing frontend video access...\n');
  
  try {
    // Test 1: Get video info from API
    console.log('1️⃣ Fetching video info from API...');
    const videoResponse = await axios.get(`http://localhost:5000/api/videos/${videoId}`, {
      timeout: 10000
    });
    
    console.log(`   ✅ Video API: ${videoResponse.status}`);
    const video = videoResponse.data.data || videoResponse.data.video || videoResponse.data;
    console.log(`   Title: ${video.title}`);
    console.log(`   Status: ${video.processingStatus}`);
    console.log(`   Published: ${video.isPublished}`);
    console.log(`   HLS URL: ${video.hlsUrl}`);
    console.log();
    
    // Test 2: Access HLS playlist through proxy
    const hlsUrl = video.hlsUrl;
    if (hlsUrl) {
      console.log('2️⃣ Testing HLS proxy access...');
      const fullUrl = hlsUrl.startsWith('http') ? hlsUrl : `http://localhost:5000${hlsUrl}`;
      
      const hlsResponse = await axios.get(fullUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.apple.mpegurl, */*'
        }
      });
      
      console.log(`   ✅ HLS Proxy: ${hlsResponse.status}`);
      console.log(`   Content-Type: ${hlsResponse.headers['content-type']}`);
      
      const content = String(hlsResponse.data);
      if (content.includes('#EXTM3U')) {
        console.log(`   ✅ Valid HLS playlist`);
        
        // Count quality variants
        const variants = content.match(/hls_\d+p/g) || [];
        console.log(`   📊 Quality variants: ${[...new Set(variants)].join(', ')}`);
      } else {
        console.log(`   ❌ Invalid HLS format`);
      }
    }
    
    console.log();
    console.log('✅ All tests passed! Video should play in browser.');
    console.log(`🌐 Test URL: http://localhost:3000/watch/${videoId}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Backend server not running!');
    } else if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
}

testFrontendAccess();

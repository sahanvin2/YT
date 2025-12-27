const axios = require('axios');

async function testVideoPlayback() {
  const videoId = '694eeed4c381b4269d3477da';
  const userId = '6921dd4e75b5b4597cbd59e7';
  
  const masterUrl = `http://localhost:5000/api/hls/${userId}/${videoId}/master.m3u8`;
  
  console.log('🔍 Testing video playback...\n');
  console.log(`📹 Video: Diary of a Wimpy Kid (2010)`);
  console.log(`🌐 URL: ${masterUrl}\n`);
  
  try {
    console.log('⏳ Fetching master playlist...');
    const response = await axios.get(masterUrl, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers['content-type']}`);
    
    if (response.status === 200) {
      console.log('\n✅ Master playlist loaded successfully!\n');
      console.log('📝 Content preview:');
      const content = String(response.data);
      const lines = content.split('\n').slice(0, 20);
      console.log(lines.join('\n'));
      
      if (lines.length >= 20) {
        console.log('... (truncated)');
      }
      
      // Check if it's valid HLS
      if (content.includes('#EXTM3U')) {
        console.log('\n✅ Valid HLS playlist format!');
      } else {
        console.log('\n❌ Invalid HLS format - missing #EXTM3U header');
      }
      
    } else {
      console.log(`\n❌ Failed to load playlist!`);
      console.log(`Response: ${response.data}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Backend server not running!');
      console.error('Run: npm run server');
    }
  }
}

testVideoPlayback();

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { uploadFilePath } = require('./backend/utils/b2');

const videoId = '694d4300ae399fee903ce3c2';
const userId = '6921dd4e75b5b4597cbd59e7';
const localDir = path.join(__dirname, 'tmp', `hls_${videoId}`);

async function retryUpload() {
  try {
    console.log('🔄 Retrying HLS upload for video:', videoId);
    console.log('📁 Local directory:', localDir);
    
    if (!fs.existsSync(localDir)) {
      console.log('❌ Local HLS files not found!');
      return;
    }

    const stats = await getDirectorySize(localDir);
    console.log(`📊 Found ${stats.files} files (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log('');
    console.log('☁️  Starting upload to B2...');
    
    let uploaded = 0;
    const uploadedFiles = [];

    // Upload master playlist
    const masterPath = path.join(localDir, 'master.m3u8');
    if (fs.existsSync(masterPath)) {
      const masterKey = `videos/${userId}/${videoId}/master.m3u8`;
      const masterUrl = await uploadFilePath(masterPath, masterKey, 'application/vnd.apple.mpegurl');
      uploadedFiles.push({ type: 'master', url: masterUrl });
      uploaded++;
      console.log(`✅ Master playlist uploaded (${uploaded}/${stats.files})`);
    }

    // Upload all quality variants
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const qualityDir = path.join(localDir, entry.name);
        const files = fs.readdirSync(qualityDir);
        
        console.log(`\n📁 Uploading ${entry.name}: ${files.length} files...`);
        
        for (const file of files) {
          const localFile = path.join(qualityDir, file);
          const fileName = `${entry.name}/${file}`;
          const b2Key = `videos/${userId}/${videoId}/${fileName}`;
          const contentType = file.endsWith('.m3u8') 
            ? 'application/vnd.apple.mpegurl' 
            : 'video/MP2T';
          
          const url = await uploadFilePath(localFile, b2Key, contentType);
          uploadedFiles.push({ type: file.endsWith('.m3u8') ? 'playlist' : 'segment', url });
          uploaded++;
          
          if (uploaded % 100 === 0) {
            console.log(`   📤 Progress: ${uploaded}/${stats.files} (${Math.round(uploaded/stats.files*100)}%)`);
          }
        }
        
        console.log(`✅ ${entry.name} complete: ${files.length} files uploaded`);
      }
    }

    console.log('');
    console.log('✅ ALL FILES UPLOADED SUCCESSFULLY!');
    console.log(`📊 Total: ${uploaded} files`);
    console.log('');
    
    // Update MongoDB
    console.log('💾 Updating database...');
    await mongoose.connect(process.env.MONGO_URI);
    const Video = require('./backend/models/Video');
    
    const masterUrl = `videos/${userId}/${videoId}/master.m3u8`;
    
    await Video.findByIdAndUpdate(videoId, {
      processingStatus: 'completed',
      hlsUrl: masterUrl,
      videoUrl: masterUrl,
      processingProgress: 100,
      processingCompleted: new Date()
    });
    
    console.log('✅ Database updated!');
    console.log('');
    console.log('🌐 Video available at:');
    console.log(`   ${process.env.CDN_BASE}/${masterUrl}`);
    console.log('');
    console.log('🎉 RETRY COMPLETE!');
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function getDirectorySize(dir) {
  let files = 0;
  let size = 0;
  
  function scan(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory()) {
        scan(fullPath);
      } else {
        files++;
        size += fs.statSync(fullPath).size;
      }
    }
  }
  
  scan(dir);
  return { files, size };
}

retryUpload();

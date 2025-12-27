const fs = require('fs');
const path = require('path');
const { uploadFilePath } = require('./b2');
const mime = require('mime-types');

/**
 * Upload an entire pre-processed HLS folder structure to B2
 * @param {string} localFolderPath - Path to the folder containing master.m3u8 and quality folders
 * @param {string} videoId - Video ID to use as the base path in B2
 * @returns {Promise<{hlsUrl: string, thumbnailUrl: string|null, variants: Array}>}
 */
async function uploadHlsFolderToB2(localFolderPath, videoId) {
  console.log(`📁 Starting HLS folder upload for video ${videoId}`);
  console.log(`📂 Local folder: ${localFolderPath}`);

  if (!fs.existsSync(localFolderPath)) {
    throw new Error(`Folder does not exist: ${localFolderPath}`);
  }

  // Check for master.m3u8
  const masterPath = path.join(localFolderPath, 'master.m3u8');
  if (!fs.existsSync(masterPath)) {
    throw new Error('master.m3u8 not found in folder');
  }

  const uploadedFiles = [];
  const variants = [];
  let thumbnailUrl = null;

  // Recursive function to get all files
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });
    
    return arrayOfFiles;
  }

  const allFiles = getAllFiles(localFolderPath);
  console.log(`📦 Found ${allFiles.length} files to upload`);

  // Upload all files
  for (let i = 0; i < allFiles.length; i++) {
    const localFile = allFiles[i];
    const relativePath = path.relative(localFolderPath, localFile);
    const b2Key = `hls/${videoId}/${relativePath.replace(/\\/g, '/')}`;
    
    const ext = path.extname(localFile).toLowerCase();
    let contentType = mime.lookup(localFile) || 'application/octet-stream';
    
    // Set proper content types for HLS files
    if (ext === '.m3u8') {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (ext === '.ts') {
      contentType = 'video/mp2t';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }

    console.log(`  📤 Uploading ${i + 1}/${allFiles.length}: ${relativePath}`);
    
    try {
      const url = await uploadFilePath(localFile, b2Key, contentType);
      uploadedFiles.push({ path: relativePath, url, b2Key });

      // Track thumbnail
      if (!thumbnailUrl && (ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
        if (relativePath.includes('thumbnail') || relativePath.includes('poster')) {
          thumbnailUrl = url;
        }
      }

      // Track quality variants
      if (relativePath.includes('hls_') && ext === '.m3u8' && !relativePath.includes('master')) {
        const match = relativePath.match(/hls_(\d+)p/);
        if (match) {
          const resolution = parseInt(match[1]);
          variants.push({
            resolution: `${resolution}p`,
            height: resolution,
            url: url,
            path: relativePath
          });
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to upload ${relativePath}:`, error.message);
      throw new Error(`Upload failed for ${relativePath}: ${error.message}`);
    }
  }

  // The HLS URL is the master.m3u8
  const hlsUrl = uploadedFiles.find(f => f.path === 'master.m3u8')?.url;
  
  if (!hlsUrl) {
    throw new Error('Failed to upload master.m3u8');
  }

  // Sort variants by resolution
  variants.sort((a, b) => b.height - a.height);

  console.log(`✅ HLS folder upload complete!`);
  console.log(`   📺 HLS URL: ${hlsUrl}`);
  console.log(`   🖼️  Thumbnail: ${thumbnailUrl || 'None'}`);
  console.log(`   📊 Variants: ${variants.length}`);

  return {
    hlsUrl,
    thumbnailUrl,
    variants,
    uploadedFiles: uploadedFiles.length,
    totalSize: allFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0)
  };
}

/**
 * Upload HLS folder and create video entry
 * @param {string} localFolderPath - Path to HLS folder
 * @param {Object} videoData - Video metadata (title, description, etc.)
 * @param {string} userId - User ID of uploader
 * @returns {Promise<Object>} - Upload result with URLs
 */
async function uploadPreProcessedVideo(localFolderPath, videoData, userId) {
  const videoId = videoData._id || require('mongoose').Types.ObjectId().toString();
  
  const uploadResult = await uploadHlsFolderToB2(localFolderPath, videoId);
  
  return {
    videoId,
    ...uploadResult,
    metadata: videoData
  };
}

module.exports = {
  uploadHlsFolderToB2,
  uploadPreProcessedVideo
};

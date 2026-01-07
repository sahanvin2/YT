/**
 * Batch Video Processor
 * 
 * Process multiple videos from a folder and upload to B2
 * 
 * Usage:
 *   node batch-video-processor.js path/to/videos/folder
 *   node batch-video-processor.js C:\\Movies --category movies --genre action
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { processVideo } = require('./local-video-processor');

// Supported video formats
const SUPPORTED_FORMATS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

/**
 * Get video files from directory
 */
function getVideoFiles(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  const files = fs.readdirSync(directory);
  const videoFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
  });

  return videoFiles.map(file => path.join(directory, file));
}

/**
 * Extract title from filename
 */
function extractTitle(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  
  // Clean up common patterns
  return basename
    .replace(/\[.*?\]/g, '') // Remove [tags]
    .replace(/\(.*?\)/g, '') // Remove (year) etc
    .replace(/\d{4}/g, '') // Remove years
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

/**
 * Process multiple videos in batch
 */
async function batchProcess(directory, options = {}) {
  console.log('🎬 Batch Video Processor Starting...');
  console.log(`📁 Directory: ${directory}`);
  
  const videoFiles = getVideoFiles(directory);
  console.log(`📺 Found ${videoFiles.length} video files`);
  
  if (videoFiles.length === 0) {
    console.log('❌ No video files found in directory');
    return;
  }

  // List files to be processed
  console.log('📋 Files to process:');
  videoFiles.forEach((file, index) => {
    const title = extractTitle(file);
    console.log(`   ${index + 1}. ${title} (${path.basename(file)})`);
  });

  console.log(`\n⏱️  Starting batch processing...`);
  
  const results = {
    total: videoFiles.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Process files one by one (to avoid overwhelming system)
  for (let i = 0; i < videoFiles.length; i++) {
    const filePath = videoFiles[i];
    const title = extractTitle(filePath);
    const filename = path.basename(filePath);
    
    console.log(`\n🔄 Processing ${i + 1}/${videoFiles.length}: ${filename}`);
    console.log(`   Title: ${title}`);
    
    try {
      await processVideo(filePath, title, '', options);
      results.successful++;
      console.log(`✅ Completed: ${filename}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        file: filename,
        error: error.message
      });
      console.error(`❌ Failed: ${filename} - ${error.message}`);
    }
  }

  // Summary
  console.log('\n📊 Batch Processing Summary:');
  console.log(`   Total: ${results.total}`);
  console.log(`   Successful: ${results.successful}`);
  console.log(`   Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed files:');
    results.errors.forEach(({ file, error }) => {
      console.log(`   • ${file}: ${error}`);
    });
  }

  return results;
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('📖 Usage:');
    console.log('  node batch-video-processor.js <video-directory> [options]');
    console.log('  node batch-video-processor.js C:\\Movies');
    console.log('  node batch-video-processor.js ./videos --category series --genre drama');
    console.log('\nSupported formats:', SUPPORTED_FORMATS.join(', '));
    process.exit(1);
  }

  const [directory, ...rest] = args;
  
  // Parse options
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      const key = rest[i].substring(2);
      const value = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true;
      options[key] = value;
      if (value !== true) i++; // Skip next argument if it was used as value
    }
  }

  batchProcess(directory, options)
    .then(results => {
      console.log('\n🎉 Batch processing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Batch processing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { batchProcess, getVideoFiles, extractTitle };
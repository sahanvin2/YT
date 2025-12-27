/**
 * Clean Up Temporary Files
 * This script cleans old temporary files that are no longer needed
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const cleanupTempFiles = () => {
  console.log('\n🧹 Starting Temporary Files Cleanup...\n');

  const tmpDir = path.join(__dirname, 'tmp');
  
  if (!fs.existsSync(tmpDir)) {
    console.log('⚠️  tmp directory does not exist');
    return;
  }

  let deletedFiles = 0;
  let deletedDirs = 0;
  let totalSize = 0;
  let errors = 0;

  // Age threshold - delete files older than 7 days
  const ageThresholdMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();

  console.log(`📁 Scanning directory: ${tmpDir}`);
  console.log(`🗓️  Deleting files older than 7 days\n`);
  console.log('─'.repeat(70));

  const scanDirectory = (dir) => {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        try {
          const stats = fs.statSync(fullPath);
          const ageMs = now - stats.mtimeMs;
          const ageDays = ageMs / (24 * 60 * 60 * 1000);

          if (stats.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(fullPath);
            
            // Try to remove empty directory
            try {
              if (fs.readdirSync(fullPath).length === 0 && ageMs > ageThresholdMs) {
                fs.rmdirSync(fullPath);
                console.log(`   🗑️  Removed empty dir: ${path.relative(tmpDir, fullPath)}`);
                deletedDirs++;
              }
            } catch (e) {
              // Directory not empty or other error
            }
          } else if (stats.isFile()) {
            // Delete old files
            if (ageMs > ageThresholdMs) {
              const sizeKB = stats.size / 1024;
              const sizeMB = sizeKB / 1024;
              
              fs.unlinkSync(fullPath);
              console.log(`   ✅ Deleted: ${path.relative(tmpDir, fullPath)} (${sizeMB.toFixed(2)} MB, ${ageDays.toFixed(1)} days old)`);
              
              deletedFiles++;
              totalSize += stats.size;
            }
          }
        } catch (itemError) {
          console.log(`   ❌ Error processing ${item}: ${itemError.message}`);
          errors++;
        }
      }
    } catch (dirError) {
      console.error(`   ❌ Error reading directory ${dir}: ${dirError.message}`);
      errors++;
    }
  };

  scanDirectory(tmpDir);

  console.log('─'.repeat(70));
  console.log('\n📊 CLEANUP SUMMARY:');
  console.log(`   Files deleted: ${deletedFiles}`);
  console.log(`   Directories deleted: ${deletedDirs}`);
  console.log(`   Space freed: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Errors: ${errors}`);
  console.log();

  if (deletedFiles === 0 && deletedDirs === 0) {
    console.log('✨ No old files to clean up!\n');
  } else {
    console.log('✅ Cleanup completed!\n');
  }
};

// Run cleanup
console.log('\n' + '='.repeat(70));
console.log('   TEMPORARY FILES CLEANUP');
console.log('='.repeat(70));

cleanupTempFiles();

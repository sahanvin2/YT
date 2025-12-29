/**
 * CRITICAL: Cleanup script to remove any temp files from EC2
 * This prevents disk from filling up and crashing the server
 * Run this periodically via cron or manually
 */

const fs = require('fs');
const path = require('path');

const tmpDirs = [
  path.join(__dirname, '../../tmp'),
  path.join(__dirname, '../../tmp/uploads'),
  path.join(__dirname, '../../uploads')
];

function cleanupDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { deleted: 0, errors: 0 };
  }

  let deleted = 0;
  let errors = 0;
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          fs.unlinkSync(filePath);
          deleted++;
        } else if (stats.isDirectory()) {
          // Recursively clean subdirectories
          const subResult = cleanupDir(filePath);
          deleted += subResult.deleted;
          errors += subResult.errors;
          totalSize += subResult.totalSize;
          // Remove empty directory
          try {
            fs.rmdirSync(filePath);
          } catch (e) {
            // Directory not empty, that's ok
          }
        }
      } catch (err) {
        console.error(`Error deleting ${filePath}:`, err.message);
        errors++;
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err.message);
    errors++;
  }

  return { deleted, errors, totalSize };
}

console.log('🧹 Starting temp file cleanup...\n');

let totalDeleted = 0;
let totalErrors = 0;
let totalSize = 0;

for (const dir of tmpDirs) {
  console.log(`Cleaning: ${dir}`);
  const result = cleanupDir(dir);
  totalDeleted += result.deleted;
  totalErrors += result.errors;
  totalSize += result.totalSize;
  console.log(`  Deleted: ${result.deleted} files, Errors: ${result.errors}, Size: ${(result.totalSize / 1024 / 1024).toFixed(2)}MB\n`);
}

console.log('✅ Cleanup complete!');
console.log(`   Total files deleted: ${totalDeleted}`);
console.log(`   Total errors: ${totalErrors}`);
console.log(`   Total space freed: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

if (totalDeleted > 0) {
  console.log(`\n⚠️  WARNING: ${totalDeleted} temp files were found on EC2!`);
  console.log('   This should not happen - files should stream directly to B2.');
  console.log('   Check upload configuration to ensure useTempFiles: false');
}


/**
 * Cleanup Script for HLS Migration
 * 
 * This script cleans up old temporary files and prepares the system for HLS
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting cleanup...\n');

// Cleanup temporary directories
const dirsToClean = [
  path.join(__dirname, '../tmp'),
  path.join(__dirname, '../uploads/variants')
];

let totalCleaned = 0;
let totalSize = 0;

for (const dir of dirsToClean) {
  if (fs.existsSync(dir)) {
    console.log(`📁 Cleaning: ${dir}`);
    
    const files = getAllFiles(dir);
    files.forEach(file => {
      try {
        const stats = fs.statSync(file);
        totalSize += stats.size;
        fs.unlinkSync(file);
        totalCleaned++;
      } catch (e) {
        console.error(`   ❌ Failed to delete: ${file}`);
      }
    });
    
    console.log(`   ✅ Cleaned ${files.length} files\n`);
  } else {
    console.log(`   ⚠️  Directory not found: ${dir}\n`);
  }
}

console.log('========================================');
console.log(`✅ Cleanup completed`);
console.log(`📦 Files deleted: ${totalCleaned}`);
console.log(`💾 Space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log('========================================\n');

// Helper function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

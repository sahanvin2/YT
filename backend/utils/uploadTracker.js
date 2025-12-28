/**
 * Upload Progress Tracker
 * Saves upload progress to detect stalls and provide resume capability
 */

const fs = require('fs');
const path = require('path');

class UploadTracker {
  constructor(videoId, totalFiles) {
    this.videoId = videoId;
    this.totalFiles = totalFiles;
    this.uploadedFiles = 0;
    this.failedFiles = 0;
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.progressFile = path.join(__dirname, '../tmp', `upload_progress_${videoId}.json`);
    
    // Ensure tmp directory exists
    const tmpDir = path.dirname(this.progressFile);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  }

  updateProgress(uploaded, failed = 0) {
    this.uploadedFiles = uploaded;
    this.failedFiles = failed;
    this.lastUpdateTime = Date.now();
    
    const progress = {
      videoId: this.videoId,
      totalFiles: this.totalFiles,
      uploadedFiles: this.uploadedFiles,
      failedFiles: this.failedFiles,
      percentage: Math.round((this.uploadedFiles / this.totalFiles) * 100),
      startTime: this.startTime,
      lastUpdateTime: this.lastUpdateTime,
      elapsedSeconds: Math.round((this.lastUpdateTime - this.startTime) / 1000),
      estimatedRemaining: this.getEstimatedRemaining()
    };

    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
    } catch (error) {
      // Silently fail - progress tracking is not critical
    }

    return progress;
  }

  getEstimatedRemaining() {
    if (this.uploadedFiles === 0) return null;
    
    const elapsed = Date.now() - this.startTime;
    const avgTimePerFile = elapsed / this.uploadedFiles;
    const remaining = this.totalFiles - this.uploadedFiles;
    const estimatedMs = remaining * avgTimePerFile;
    
    return Math.round(estimatedMs / 1000); // seconds
  }

  isStalled() {
    const timeSinceUpdate = Date.now() - this.lastUpdateTime;
    return timeSinceUpdate > 120000; // 2 minutes without update = stalled
  }

  complete() {
    try {
      if (fs.existsSync(this.progressFile)) {
        fs.unlinkSync(this.progressFile);
      }
    } catch (error) {
      // Silently fail
    }
  }

  static getProgress(videoId) {
    const progressFile = path.join(__dirname, '../tmp', `upload_progress_${videoId}.json`);
    try {
      if (fs.existsSync(progressFile)) {
        const data = fs.readFileSync(progressFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}

module.exports = UploadTracker;

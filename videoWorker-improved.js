import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import video transcoder
let videoTranscoder;
try {
  const transcoderModule = await import('../utils/videoTranscoder.js');
  videoTranscoder = transcoderModule.default || transcoderModule;
} catch (err) {
  console.warn('⚠️  Video transcoder not available:', err.message);
}

const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log('✅ Worker connected to Redis at', process.env.REDIS_HOST || '127.0.0.1');
});

connection.on('error', (err) => {
  if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
  console.error('❌ Redis connection error:', err.message);
});

const worker = new Worker(
  'video-processing',
  async (job) => {
    const { videoId, inputPath, outputPath, variants } = job.data;
    console.log(`🎬 Processing video job ${job.id}`);
    console.log(`   Video ID: ${videoId}`);
    console.log(`   Input: ${inputPath}`);
    console.log(`   Variants: ${variants?.join(', ') || 'default'}`);

    try {
      // Update job progress
      await job.updateProgress(10);

      if (videoTranscoder && typeof videoTranscoder.transcodeVideo === 'function') {
        console.log('🔄 Starting video transcoding...');
        
        const result = await videoTranscoder.transcodeVideo(inputPath, outputPath, {
          variants: variants || ['720p', '480p', '360p'],
          onProgress: async (percent) => {
            await job.updateProgress(Math.min(10 + percent * 0.9, 100));
            console.log(`   Progress: ${Math.round(percent)}%`);
          }
        });

        console.log('✅ Video transcoded successfully');
        console.log(`   Generated variants: ${result.variants?.length || 0}`);
        
        await job.updateProgress(100);
        return {
          status: 'completed',
          videoId,
          variants: result.variants,
          thumbnail: result.thumbnail,
          duration: result.duration
        };
      } else {
        // Fallback: simulate processing
        console.log('⚠️  Transcoder not available, simulating...');
        await job.updateProgress(50);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await job.updateProgress(100);
        
        return {
          status: 'completed',
          videoId,
          message: 'Processed without transcoding'
        };
      }
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process 2 videos at a time
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000 // per minute
    }
  }
);

worker.on('completed', (job, result) => {
  console.log(`✔ Job ${job.id} completed successfully`);
  console.log(`   Result:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`✖ Job ${job?.id} failed:`, err.message);
});

worker.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${Math.round(progress)}%`);
});

console.log('🚀 Video worker started successfully');
console.log('   Concurrency: 2 videos at a time');
console.log('   Rate limit: 5 jobs per minute');
console.log('   Transcoder:', videoTranscoder ? 'Available ✓' : 'Not Available ✗');

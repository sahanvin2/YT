require('dotenv').config();
const IORedis = require('ioredis');
const { Queue } = require('bullmq');

const redis = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
});

const hlsQueue = new Queue('hls-processing', { connection: redis });

async function checkQueueStatus() {
  console.log('\n🔍 Redis Queue Status Check\n' + '='.repeat(60));
  
  try {
    // Get queue counts
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      hlsQueue.getWaitingCount(),
      hlsQueue.getActiveCount(),
      hlsQueue.getCompletedCount(),
      hlsQueue.getFailedCount(),
      hlsQueue.getDelayedCount()
    ]);

    console.log('📊 Queue Statistics:');
    console.log(`   ⏳ Waiting: ${waiting} jobs`);
    console.log(`   🔄 Active: ${active} jobs`);
    console.log(`   ✅ Completed: ${completed} jobs`);
    console.log(`   ❌ Failed: ${failed} jobs`);
    console.log(`   ⏰ Delayed: ${delayed} jobs`);
    console.log(`   📈 Total: ${waiting + active + completed + failed + delayed} jobs`);

    // Get active jobs
    if (active > 0) {
      console.log('\n🔄 Currently Processing:');
      const activeJobs = await hlsQueue.getActive();
      for (const job of activeJobs) {
        console.log(`   - Job ${job.id}: ${job.data.videoId}`);
        console.log(`     Progress: ${job.progress}%`);
        console.log(`     Started: ${new Date(job.processedOn).toLocaleString()}`);
      }
    }

    // Get waiting jobs
    if (waiting > 0) {
      console.log('\n⏳ Waiting Jobs:');
      const waitingJobs = await hlsQueue.getWaiting(0, 10);
      waitingJobs.forEach((job, idx) => {
        console.log(`   ${idx + 1}. Video ID: ${job.data.videoId}`);
      });
      if (waiting > 10) {
        console.log(`   ... and ${waiting - 10} more`);
      }
    }

    // Get failed jobs
    if (failed > 0) {
      console.log('\n❌ Failed Jobs:');
      const failedJobs = await hlsQueue.getFailed(0, 5);
      for (const job of failedJobs) {
        console.log(`   - Video ID: ${job.data.videoId}`);
        console.log(`     Error: ${job.failedReason}`);
        console.log(`     Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
      }
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await redis.quit();
    process.exit(0);
  }
}

checkQueueStatus();

const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null
});

const hlsQueue = new Queue('hls-processing', { connection });

async function checkFailedJobs() {
  console.log('🔍 Checking failed jobs...\n');
  
  try {
    const failed = await hlsQueue.getFailed();
    
    if (failed.length === 0) {
      console.log('✅ No failed jobs!');
    } else {
      console.log(`❌ Found ${failed.length} failed jobs:\n`);
      
      for (const job of failed) {
        console.log(`📹 Video ID: ${job.data.videoId}`);
        console.log(`   Job ID: ${job.id}`);
        console.log(`   Failed at: ${new Date(job.failedReason?.timestamp || job.processedOn).toLocaleString()}`);
        console.log(`   Error: ${job.failedReason}`);
        console.log(`   Stack: ${job.stacktrace?.[0] || 'N/A'}`);
        console.log('');
      }
    }
    
    const counts = await hlsQueue.getJobCounts();
    console.log('📊 Queue Status:');
    console.log(counts);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.quit();
    process.exit(0);
  }
}

checkFailedJobs();

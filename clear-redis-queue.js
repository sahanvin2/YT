/**
 * Clear Redis Queue
 * Removes all HLS processing jobs from the queue
 */

require('dotenv').config();
const IORedis = require('ioredis');

const clearQueue = async () => {
  console.log('\n🧹 Clearing Redis Queue...\n');

  const redis = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  });

  try {
    // Get queue length before
    const beforeCount = await redis.llen('hls_queue');
    console.log(`📊 Jobs in queue before: ${beforeCount}`);

    // Clear the HLS queue
    await redis.del('hls_queue');
    
    // Clear any job data
    const keys = await redis.keys('bull:hls_queue:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Deleted ${keys.length} job-related keys`);
    }

    // Clear completed/failed sets
    await redis.del('bull:hls_queue:completed');
    await redis.del('bull:hls_queue:failed');
    await redis.del('bull:hls_queue:active');
    await redis.del('bull:hls_queue:wait');
    await redis.del('bull:hls_queue:delayed');

    const afterCount = await redis.llen('hls_queue');
    console.log(`📊 Jobs in queue after: ${afterCount}`);

    console.log('\n✅ Redis queue cleared successfully!');
    console.log('   You can now upload new videos.\n');

    redis.disconnect();
  } catch (error) {
    console.error('\n❌ Error clearing queue:', error.message);
    redis.disconnect();
    process.exit(1);
  }
};

clearQueue();

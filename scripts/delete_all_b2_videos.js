const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID;
const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY;
const B2_BUCKET = process.env.B2_BUCKET || 'movia-prod';
const B2_REGION = 'us-east-005';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';

const s3 = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
});

async function deleteAllVideos() {
  try {
    console.log('🗑️  Starting to delete ALL files from B2 bucket (including all folders)...');
    console.log(`📦 Bucket: ${B2_BUCKET}`);
    
    let continuationToken = null;
    let totalDeleted = 0;
    let batchCount = 0;
    
    do {
      batchCount++;
      console.log(`\n📋 Batch ${batchCount}: Listing objects...`);
      
      // List objects (no prefix - get everything)
      const listCommand = new ListObjectsV2Command({
        Bucket: B2_BUCKET,
        ContinuationToken: continuationToken,
        MaxKeys: 1000  // Max allowed per request
      });
      
      const listResponse = await s3.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log('✅ No more objects to delete.');
        break;
      }
      
      console.log(`📋 Found ${listResponse.Contents.length} objects in this batch...`);
      
      // Show first few file paths
      if (listResponse.Contents.length > 0) {
        console.log('   Examples:');
        listResponse.Contents.slice(0, 5).forEach(obj => {
          const size = (obj.Size / 1024 / 1024).toFixed(2);
          console.log(`   - ${obj.Key} (${size} MB)`);
        });
        if (listResponse.Contents.length > 5) {
          console.log(`   ... and ${listResponse.Contents.length - 5} more files`);
        }
      }
      
      // Prepare objects for deletion
      const objectsToDelete = listResponse.Contents.map(obj => ({
        Key: obj.Key
      }));
      
      // Delete objects in batch
      console.log(`🗑️  Deleting ${objectsToDelete.length} objects...`);
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: B2_BUCKET,
        Delete: {
          Objects: objectsToDelete,
          Quiet: false
        }
      });
      
      const deleteResponse = await s3.send(deleteCommand);
      
      if (deleteResponse.Deleted) {
        totalDeleted += deleteResponse.Deleted.length;
        console.log(`✅ Deleted ${deleteResponse.Deleted.length} objects (Total: ${totalDeleted})`);
      }
      
      if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
        console.error(`❌ ${deleteResponse.Errors.length} objects failed to delete:`);
        deleteResponse.Errors.forEach(err => {
          console.error(`  - ${err.Key}: ${err.Message}`);
        });
      }
      
      // Check if there are more objects
      continuationToken = listResponse.NextContinuationToken;
      
      // Small delay to avoid rate limiting
      if (continuationToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } while (continuationToken);
    
    console.log(`\n🎉 Deletion complete!`);
    console.log(`📊 Total batches: ${batchCount}`);
    console.log(`📊 Total objects deleted: ${totalDeleted}`);
    console.log(`✅ B2 bucket is now empty!`);
    
  } catch (error) {
    console.error('❌ Error deleting videos from B2:', error);
    throw error;
  }
}

// Run the deletion
deleteAllVideos()
  .then(() => {
    console.log('\n✅ All videos deleted from B2 bucket!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to delete videos:', error.message);
    process.exit(1);
  });

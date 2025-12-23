const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Initialize B2 (S3-compatible) client
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.B2_BUCKET || 'movia-prod';

/**
 * Upload a file to B2 and return CDN URL
 */
async function uploadFilePath(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: 'video/mp4'
  });

  await s3Client.send(command);
  
  // Return CDN URL
  const cdnBase = process.env.CDN_BASE || 'https://Xclub.b-cdn.net';
  return `${cdnBase}/${key}`;
}

module.exports = { uploadFilePath };

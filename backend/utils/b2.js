const fs = require('fs');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Ensure env vars exist
function requiredEnv(name, value) {
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

const B2_BUCKET = requiredEnv('B2_BUCKET', process.env.B2_BUCKET);
const B2_PUBLIC_BASE = requiredEnv('B2_PUBLIC_BASE', process.env.B2_PUBLIC_BASE);
const B2_ENDPOINT = requiredEnv('B2_ENDPOINT', process.env.B2_ENDPOINT);
const B2_ACCESS_KEY_ID = requiredEnv('B2_ACCESS_KEY_ID', process.env.B2_ACCESS_KEY_ID);
const B2_SECRET_ACCESS_KEY = requiredEnv('B2_SECRET_ACCESS_KEY', process.env.B2_SECRET_ACCESS_KEY);

const s3 = new S3Client({
  region: 'auto',
  endpoint: B2_ENDPOINT,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
  requestHandler: {
    requestTimeout: 300000, // 5 minutes timeout for large uploads
    connectionTimeout: 60000, // 1 minute connection timeout
  },
  maxAttempts: 3,
});

/**
 * Uploads a file from a local path to B2
 * @param {string} filePath - Local file path
 * @param {string} key - Storage key in B2
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
async function uploadFilePath(filePath, key, contentType = 'application/octet-stream') {
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  const maxAttempts = 5; // Increased from 3 to 5 for HLS uploads
  const baseDelayMs = 1000; // Increased from 500ms to 1000ms

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const fileStream = fs.createReadStream(filePath);

    try {
      await s3.send(new PutObjectCommand({
        Bucket: B2_BUCKET,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        //ACL: 'public-read',
      }));

      return publicUrl(key);
    } catch (err) {
      const message = err?.message || String(err);
      const code = err?.code;

      // Expanded list of retryable errors for HLS uploads
      const isTransient =
        message.toLowerCase().includes('socket hang up') ||
        message.toLowerCase().includes('non-retryable streaming request') ||
        message.toLowerCase().includes('internal error') ||
        message.toLowerCase().includes('stream reset') ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'EPIPE' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNREFUSED';

      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`   🔄 Retry ${attempt}/${maxAttempts} after ${Math.round(delay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Should never get here, but keep a safe fallback.
  return publicUrl(key);
}

/**
 * Deletes a file from B2
 * @param {string} key
 */
async function deleteFile(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: B2_BUCKET,
    Key: key,
  }));
}

/**
 * Generates presigned URL for direct client-side upload
 * @param {string} key
 * @param {string} contentType
 * @param {number} expires - seconds
 */
async function presignPut(key, contentType, expires = 900) {
  const cmd = new PutObjectCommand({
    Bucket: B2_BUCKET,
    Key: key,
    ContentType: contentType,
    //ACL: 'public-read',
  });
  return await getSignedUrl(s3, cmd, { expiresIn: expires });
}

/**
 * Returns public URL for a file key
 * @param {string} key
 */
function publicUrl(key) {
  const cleanBase = B2_PUBLIC_BASE.replace(/\/$/, '');
  const cleanKey = key.replace(/^\//, '');
  return `${cleanBase}/${cleanKey}`;
}

const { GetObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Generate a signed GET URL to access private B2 files
 * @param {string} key - file key in the bucket
 * @param {number} expires - seconds the URL is valid (default 15 min)
 * @param {object} options - optional overrides (responseContentDisposition, responseContentType)
 * @returns {Promise<string>} - signed URL
 */
async function presignGet(key, expires = 900, options = {}) {
  const params = {
    Bucket: B2_BUCKET,
    Key: key,
  };

  if (options.responseContentDisposition) {
    params.ResponseContentDisposition = options.responseContentDisposition;
  }
  if (options.responseContentType) {
    params.ResponseContentType = options.responseContentType;
  }

  const cmd = new GetObjectCommand(params);
  return await getSignedUrl(s3, cmd, { expiresIn: expires });
}

module.exports = {
  uploadFilePath,
  deleteFile,
  presignPut,
  presignGet,   // <-- export this
  publicUrl,
};

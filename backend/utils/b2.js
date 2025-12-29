const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Make B2 optional for local development
const isLocalDev = process.env.NODE_ENV !== 'production' && !process.env.B2_BUCKET;

function requiredEnv(name, value) {
  if (!value && !isLocalDev) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value || '';
}

const B2_BUCKET = process.env.B2_BUCKET || '';
const B2_PUBLIC_BASE = process.env.B2_PUBLIC_BASE || 'http://localhost:5000/uploads';
const B2_ENDPOINT = process.env.B2_ENDPOINT || '';
const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID || '';
const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY || '';

// Only initialize S3 client if B2 is configured
let s3 = null;
if (!isLocalDev && B2_BUCKET && B2_ENDPOINT) {
  s3 = new S3Client({
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
} else if (isLocalDev) {
  console.log('⚠️  B2 storage not configured - using local file storage for development');
}

/**
 * Uploads a file from a local path to B2
 * @param {string} filePath - Local file path
 * @param {string} key - Storage key in B2
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
async function uploadFilePath(filePath, key, contentType = 'application/octet-stream') {
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath}`);

  // Local development: copy file to uploads directory
  if (isLocalDev || !s3) {
    const uploadsDir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    
    const localFilePath = path.join(uploadsDir, key);
    const localDir = path.dirname(localFilePath);
    fs.mkdirSync(localDir, { recursive: true });
    
    fs.copyFileSync(filePath, localFilePath);
    console.log(`📁 Local dev: Copied file to ${localFilePath}`);
    return publicUrl(key);
  }

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
  if (isLocalDev || !s3) {
    const localFilePath = path.join(__dirname, '../../uploads', key);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`🗑️  Local dev: Deleted file ${localFilePath}`);
    }
    return;
  }
  
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
  if (isLocalDev || !s3) {
    // Return local URL for development
    return publicUrl(key);
  }
  
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
  if (isLocalDev || !s3) {
    // Return local URL for development
    return publicUrl(key);
  }
  
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

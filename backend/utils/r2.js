const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');

function required(name, val) {
  if (!val) throw new Error(`Missing required env ${name}`);
  return val;
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE; // e.g. https://pub-xxxx.r2.dev/movia-prod OR https://pub-xxxx.r2.dev
const R2_PUBLIC_APPEND_BUCKET = process.env.R2_PUBLIC_APPEND_BUCKET; // 'true' | 'false' (default true)

// Endpoint styles supported by R2
// - https://<ACCOUNT_ID>.r2.cloudflarestorage.com
// - or custom domain via CF; for S3 API we use the r2.cloudflarestorage.com endpoint
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

const s3 = new S3Client({
  region: 'auto',
  endpoint: required('R2_ENDPOINT', R2_ENDPOINT),
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY)
  }
});

function publicUrl(key) {
  const base = required('R2_PUBLIC_BASE', R2_PUBLIC_BASE).replace(/\/$/, '');
  const bucket = required('R2_BUCKET', R2_BUCKET);
  const shouldAppend = (R2_PUBLIC_APPEND_BUCKET || 'true').toLowerCase() !== 'false';
  // If base already ends with the bucket name, do not duplicate; optionally append bucket segment.
  const withBucket = !shouldAppend
    ? base
    : (base.endsWith(`/${bucket}`) ? base : `${base}/${bucket}`);
  return `${withBucket}/${encodeURI(key)}`;
}

async function uploadBuffer(buffer, key, contentType = 'application/octet-stream') {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: required('R2_BUCKET', R2_BUCKET),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    }
  });
  await upload.done();
  return publicUrl(key);
}

async function uploadFilePath(filePath, key, contentType = undefined) {
  const stream = fs.createReadStream(filePath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: required('R2_BUCKET', R2_BUCKET),
      Key: key,
      Body: stream,
      ContentType: contentType,
      ACL: 'public-read'
    }
  });
  await upload.done();
  return publicUrl(key);
}

async function deleteObject(key) {
  const cmd = new DeleteObjectCommand({
    Bucket: required('R2_BUCKET', R2_BUCKET),
    Key: key
  });
  await s3.send(cmd);
}

module.exports = {
  uploadBuffer,
  uploadFilePath,
  deleteObject,
  publicUrl
};

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { publicUrl } = require('../utils/r2');

function required(name, val) {
  if (!val) throw new Error(`Missing required env ${name}`);
  return val;
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE; // e.g. https://pub-....r2.dev
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

const s3 = new S3Client({
  region: 'auto',
  endpoint: required('R2_ENDPOINT', R2_ENDPOINT),
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY)
  }
});

exports.presignPut = async (req, res) => {
  try {
    const { fileName, contentType } = req.body || {};
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, message: 'fileName and contentType are required' });
    }
    const ts = Date.now();
    const key = `videos/${req.user.id}/${ts}_${fileName}`;
    const cmd = new PutObjectCommand({
      Bucket: required('R2_BUCKET', R2_BUCKET),
      Key: key,
      ContentType: contentType,
      ACL: 'public-read'
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 minutes
    // Use shared helper ensuring bucket segment is present consistently
    const finalPublicUrl = publicUrl(key);
    res.json({ success: true, url, key, publicUrl: finalPublicUrl, expiresIn: 900 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

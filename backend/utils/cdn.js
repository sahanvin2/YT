/**
 * CDN URL utilities
 * Converts storage URLs to CDN URLs if CDN is configured
 */

/**
 * Convert a storage URL to CDN URL if CDN is configured
 * @param {string} originalUrl - Original storage URL (B2, R2, etc.)
 * @returns {string} - CDN URL if configured, otherwise original URL
 */
function cdnUrlFrom(originalUrl) {
  if (!originalUrl) return originalUrl;

  const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL;
  
  // If no CDN is configured, return original URL
  if (!CDN_BASE) {
    // Only warn once to avoid spam
    if (!cdnUrlFrom._warned) {
      console.warn('⚠️ CDN_BASE or CDN_URL not set in environment variables');
      console.warn('   Set CDN_BASE=https://Xclub.b-cdn.net in your .env file');
      cdnUrlFrom._warned = true;
    }
    return originalUrl;
  }
  
  // Log CDN base on first use
  if (!cdnUrlFrom._logged) {
    console.log(`✅ CDN configured: ${CDN_BASE}`);
    cdnUrlFrom._logged = true;
  }

  try {
    // Try to extract the key/path from the original URL
    const url = new URL(originalUrl);
    let key = null;

    // Extract key from different URL formats
    if (url.hostname.includes('backblazeb2.com') || url.hostname.endsWith('.b2.dev')) {
      // B2 URL format: https://f000.backblazeb2.com/file/<bucket>/<key>
      // For Bunny CDN with origin: https://f005.backblazeb2.com/file/movia-prod/<key>
      // We need to extract the key part after /file/<bucket>/
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'file' && parts.length > 2) {
        // Skip 'file' and bucket name, get the rest as key
        key = parts.slice(2).join('/');
      } else {
        key = decodeURIComponent(url.pathname.slice(1));
      }
    } else if (url.hostname.includes('r2.dev') || url.hostname.includes('cloudflarestorage.com')) {
      // R2 URL format: https://pub-xxxx.r2.dev/<bucket>/<key> or https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
      const parts = url.pathname.split('/').filter(Boolean);
      key = parts.slice(1).join('/'); // Skip bucket name
    } else {
      // Fallback: assume path is the key
      key = decodeURIComponent(url.pathname.slice(1));
    }

    if (!key) {
      return originalUrl;
    }

    // Build CDN URL
    // Bunny CDN format: https://Xclub.b-cdn.net/<key>
    const cleanBase = CDN_BASE.replace(/\/$/, '');
    const cleanKey = key.replace(/^\//, '');
    const cdnUrl = `${cleanBase}/${cleanKey}`;
    
    // Debug log (only for first few conversions to avoid spam)
    if (!cdnUrlFrom._debugCount) cdnUrlFrom._debugCount = 0;
    if (cdnUrlFrom._debugCount < 3) {
      console.log(`🔄 CDN URL conversion:`);
      console.log(`   Original: ${originalUrl}`);
      console.log(`   Extracted Key: ${key}`);
      console.log(`   CDN URL: ${cdnUrl}`);
      cdnUrlFrom._debugCount++;
    }
    
    return cdnUrl;
  } catch (error) {
    // If URL parsing fails, return original URL
    console.error('❌ Error converting to CDN URL:', error.message);
    console.error('   Original URL:', originalUrl);
    return originalUrl;
  }
}

/**
 * Extract original storage key from CDN URL or original URL
 * @param {string} url - CDN URL or original storage URL
 * @returns {string|null} - Storage key or null if extraction fails
 */
function extractKeyFromUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    let key = null;

    // Check if it's a CDN URL (Bunny CDN or custom CDN)
    const CDN_BASE = process.env.CDN_BASE || process.env.CDN_URL;
    const isBunnyCdn = urlObj.hostname.includes('b-cdn.net');
    const isCdnUrl = (CDN_BASE && url.includes(CDN_BASE)) || isBunnyCdn;

    if (isCdnUrl) {
      // Extract key from CDN URL
      if (CDN_BASE && url.includes(CDN_BASE)) {
        // Custom CDN base URL
        const cdnBase = new URL(CDN_BASE);
        const pathAfterCdn = urlObj.pathname.replace(cdnBase.pathname, '');
        key = decodeURIComponent(pathAfterCdn.replace(/^\//, ''));
      } else if (isBunnyCdn) {
        // Bunny CDN URL format: https://<pullzone>.b-cdn.net/<path>
        // The path is the storage key
        key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
      } else {
        // Generic CDN - assume pathname is the key
        key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
      }
    } else if (urlObj.hostname.includes('backblazeb2.com') || urlObj.hostname.endsWith('.b2.dev')) {
      // B2 URL format
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts[0] === 'file' && parts.length > 2) {
        key = parts.slice(2).join('/');
      } else {
        key = decodeURIComponent(urlObj.pathname.slice(1));
      }
    } else if (urlObj.hostname.includes('r2.dev') || urlObj.hostname.includes('cloudflarestorage.com')) {
      // R2 URL format
      const parts = urlObj.pathname.split('/').filter(Boolean);
      key = parts.slice(1).join('/');
    } else {
      // Fallback: assume pathname is the key
      key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
    }

    return key;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
}

module.exports = {
  cdnUrlFrom,
  extractKeyFromUrl
};


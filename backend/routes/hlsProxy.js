const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');
const router = express.Router();

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientAxiosError(error) {
  const code = error?.code;
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    msg.includes('socket hang up') ||
    msg.includes('timeout')
  );
}

function b2PublicUrlForKey(key) {
  const base = process.env.B2_PUBLIC_BASE;
  if (base) {
    return `${base.replace(/\/$/, '')}/${String(key).replace(/^\//, '')}`;
  }

  // Fallback for older configs (kept for safety)
  return `https://f005.backblazeb2.com/file/movia-prod/${String(key).replace(/^\//, '')}`;
}

async function m3u8ExistsInB2(key) {
  // Some CDNs/backends can respond 200 to HEAD even when GET would 404.
  // For playlists, verify via a small GET and ensure it looks like an m3u8.
  const url = b2PublicUrlForKey(key);
  try {
    const resp = await axios.get(url, {
      responseType: 'text',
      timeout: 15000,
      validateStatus: () => true,
      httpAgent,
      httpsAgent,
      headers: {
        Range: 'bytes=0-4095'
      }
    });

    if (!(resp.status >= 200 && resp.status < 300)) return false;
    const text = typeof resp.data === 'string' ? resp.data : String(resp.data || '');
    return text.includes('#EXTM3U');
  } catch {
    return false;
  }
}

function rewriteM3u8({ content, userId, videoId, filePath }) {
  // Get base path (directory of current m3u8 file)
  const basePath = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/') + 1) : '';

  let updated = content;

  // Rewrite relative variant playlist URLs
  updated = updated.replace(/(hls_[^\s/]+\/playlist\.m3u8)/g, (match) => {
    return `/api/hls/${userId}/${videoId}/${match}`;
  });

  // Rewrite relative .ts segment URLs
  updated = updated.replace(/^([^#\n].+\.ts)$/gm, (match) => {
    const fullPath = basePath + match.trim();
    return `/api/hls/${userId}/${videoId}/${fullPath}`;
  });

  return updated;
}

async function filterMissingVariantsFromMaster({ content, userId, videoId }) {
  // Master playlist format:
  // #EXT-X-STREAM-INF:...
  // hls_720p/playlist.m3u8
  const lines = String(content).split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.startsWith('#EXT-X-STREAM-INF')) {
      const next = lines[i + 1] || '';

      // Only validate obvious variant playlist entries.
      const m = next.match(/^(hls_[^\s/]+\/playlist\.m3u8)$/);
      if (m) {
        const variantPath = m[1];
        const key = `videos/${userId}/${videoId}/${variantPath}`;
        const ok = await m3u8ExistsInB2(key);
        if (!ok) {
          console.warn(`⚠️ Missing HLS variant playlist in B2, removing from master: ${variantPath}`);
          i += 1; // Skip the next line too
          continue;
        }
      }

      out.push(line);
      // Keep the next line as-is (will be rewritten later)
      if (i + 1 < lines.length) {
        out.push(lines[i + 1]);
        i += 1;
      }
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

/**
 * Proxy endpoint for HLS master playlists and segments
 * This solves CORS issues with B2/CDN
 */
router.get('/hls/:userId/:videoId/*', async (req, res) => {
  try {
    const { userId, videoId } = req.params;
    const filePath = req.params[0]; // Everything after videoId
    
    // Construct B2 URL from env base
    const key = `videos/${userId}/${videoId}/${filePath}`;
    const b2Url = b2PublicUrlForKey(key);
    
    console.log(`📡 Proxying HLS request: ${filePath}`);
    
    const isM3u8 = filePath.endsWith('.m3u8');
    const isTs = filePath.endsWith('.ts');

    const rangeHeader = req.headers.range;
    const upstreamHeaders = {};
    if (rangeHeader) upstreamHeaders.Range = rangeHeader;

    const requestConfig = {
      responseType: isM3u8 ? 'text' : 'stream',
      timeout: isM3u8 ? 30000 : 60000,
      validateStatus: () => true,
      headers: upstreamHeaders,
      httpAgent,
      httpsAgent
    };

    // Fetch from B2 (retry transient disconnects like "socket hang up")
    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await axios.get(b2Url, requestConfig);
        break;
      } catch (e) {
        if (attempt >= 3 || !isTransientAxiosError(e)) throw e;
        const delayMs = 200 * attempt;
        console.warn(`⚠️ Upstream error (${e.code || e.message}); retrying in ${delayMs}ms: ${filePath}`);
        await sleep(delayMs);
      }
    }

    // If upstream returned an error (404, 403, etc), pass it through.
    if (response.status >= 400) {
      console.warn(`⚠️ Upstream returned ${response.status} for ${filePath}`);
      return res.status(response.status).json({
        success: false,
        message: 'Failed to load video segment'
      });
    }
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (isM3u8) {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (isTs) {
      contentType = 'video/MP2T';
    }
    
    // Set CORS headers
    const passthrough = {};
    // Preserve range-related headers if present
    if (response.headers) {
      if (response.headers['content-length']) passthrough['Content-Length'] = response.headers['content-length'];
      if (response.headers['content-range']) passthrough['Content-Range'] = response.headers['content-range'];
      if (response.headers.etag) passthrough['ETag'] = response.headers.etag;
      if (response.headers['last-modified']) passthrough['Last-Modified'] = response.headers['last-modified'];
    }

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes'
      ,
      ...passthrough
    });
    
    // ✅ Rewrite .m3u8 files to use proxy URLs
    if (isM3u8) {
      let content = response.data;

      // If this is the master playlist, remove variants whose playlists are missing.
      if (filePath.endsWith('master.m3u8')) {
        content = await filterMissingVariantsFromMaster({ content, userId, videoId });
      }

      content = rewriteM3u8({ content, userId, videoId, filePath });
      
      console.log(`✅ Rewrote m3u8 URLs for: ${filePath}`);
      res.send(content);
    } else {
      // Stream binary data (.ts files)
      if (rangeHeader && response.status === 206) {
        res.status(206);
      }

      // If client disconnects, stop downloading from upstream.
      const upstreamStream = response.data;
      const cleanup = () => {
        try {
          upstreamStream?.destroy();
        } catch {
          // ignore
        }
      };
      req.on('aborted', cleanup);
      res.on('close', cleanup);

      upstreamStream.on('error', (e) => {
        console.error(`❌ Upstream stream error for ${filePath}:`, e.message);
        try {
          res.destroy(e);
        } catch {
          // ignore
        }
      });

      upstreamStream.pipe(res);
    }
    
  } catch (error) {
    console.error('❌ HLS proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to load video segment'
    });
  }
});

// Handle OPTIONS for CORS preflight
router.options('/hls/:userId/:videoId/*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Range'
  });
  res.status(200).send();
});

module.exports = router;

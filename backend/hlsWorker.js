/**
 * DEPRECATED ENTRYPOINT
 *
 * This file historically contained an HLS worker, but it drifted out of sync with the queue payload.
 * Use the unified worker that:
 *  - downloads the source video from B2/CDN using the URL stored in Mongo
 *  - encodes to HLS (NVENC by default)
 *  - uploads HLS outputs to B2
 *  - updates Mongo with proxy URLs for playback
 *
 * Run: `node backend/workers/videoWorker.js`
 */
console.warn('⚠️ backend/hlsWorker.js is deprecated. Redirecting to backend/workers/videoWorker.js');
require('./workers/videoWorker');

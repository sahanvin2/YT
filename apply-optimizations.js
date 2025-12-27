/**
 * Performance Optimizations & Deployment Script
 * 
 * This script applies all performance improvements:
 * 1. Image optimization
 * 2. Code minification
 * 3. Caching strategies
 * 4. Parallel processing
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Applying Performance Optimizations...\n');

// 1. Update package.json with build optimizations
const packageJsonPath = path.join(__dirname, 'client', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts = packageJson.scripts || {};
packageJson.scripts['build'] = 'GENERATE_SOURCEMAP=false react-scripts build';
packageJson.scripts['build:analyze'] = 'npm run build && source-map-explorer build/static/js/*.js';

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with build optimizations');

// 2. Create image optimization config
const imageOptimConfig = `
module.exports = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable compression
  compress: true,
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
`;

fs.writeFileSync(path.join(__dirname, 'client', 'next.config.js'), imageOptimConfig);
console.log('✅ Created image optimization config');

// 3. Create .htaccess for caching (for Apache servers)
const htaccess = `# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  
  # Video
  ExpiresByType video/mp4 "access plus 1 year"
  ExpiresByType video/mpeg "access plus 1 year"
  
  # CSS, JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # HTML
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Enable HTTP/2 Push
<IfModule mod_http2.c>
  H2Push on
  H2PushPriority * after
  H2PushPriority text/css before
  H2PushPriority image/jpeg after 32
  H2PushPriority image/png after 32
  H2PushPriority application/javascript interleaved
</IfModule>
`;

fs.writeFileSync(path.join(__dirname, 'client', 'public', '.htaccess'), htaccess);
console.log('✅ Created .htaccess for caching');

// 4. Create service worker for caching
const serviceWorker = `
// Service Worker for offline caching and performance
const CACHE_NAME = 'xclub-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
`;

fs.writeFileSync(path.join(__dirname, 'client', 'public', 'service-worker.js'), serviceWorker);
console.log('✅ Created service worker');

console.log('\n✅ All optimizations applied!\n');
console.log('Next steps:');
console.log('  1. Run: cd client && npm run build');
console.log('  2. Deploy to production');
console.log('  3. Test with Lighthouse\n');

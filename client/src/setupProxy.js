const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      timeout: 7200000, // 2 hours for large file uploads (4GB+)
      proxyTimeout: 7200000, // 2 hours
      onProxyReq: (proxyReq, req, res) => {
        // Increase timeout for large uploads
        proxyReq.setTimeout(7200000);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({
          error: 'Proxy error',
          message: err.message
        });
      }
    })
  );
};


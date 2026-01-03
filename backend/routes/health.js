const express = require('express');
const mongoose = require('mongoose');
const os = require('os');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const health = {
      status: 'OK',
      uptime: process.uptime(),
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.version,
      mongodb: {
        status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        readyState: mongoose.connection.readyState
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
        freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
        totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB'
      }
    };
    
    // Return 200 if healthy, 503 if unhealthy
    const statusCode = (mongoose.connection.readyState === 1) ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };
  res.json(health);
});

module.exports = router;

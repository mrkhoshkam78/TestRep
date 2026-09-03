/**
 * Analyze Routes
 * POST /api/analyze
 */

const express = require('express');
const router = express.Router();
const { analyzeUrl, detectMedia } = require('../services/providerManager');

router.post('/', async (req, res, next) => {
  try {
    const url = req.sanitizedUrl;
    const detection = detectMedia(url);
    const info = await analyzeUrl(url);

    info.provider = info.provider || detection.providerId;
    info.mediaType = detection.mediaType;

    res.json({
      success: true,
      data: info
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

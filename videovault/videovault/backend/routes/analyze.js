/**
 * Analyze Routes
 * POST /api/analyze - Analyze a video URL
 */

const express = require('express');
const router = express.Router();
const { analyzeWithYtDlp, detectProvider } = require('../services/providerManager');

router.post('/', async (req, res, next) => {
  try {
    const url = req.sanitizedUrl;

    const provider = detectProvider(url);
    const info = await analyzeWithYtDlp(url);

    // Enrich with detected provider
    info.provider = info.provider || provider;

    res.json({
      success: true,
      data: info
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

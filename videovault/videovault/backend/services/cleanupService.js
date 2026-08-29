/**
 * Cleanup Service
 * Automatically removes temporary files after TTL
 */

const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');

const DOWNLOADS_DIR = path.join(__dirname, '..', '..', 'downloads');
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');
const TTL_MS = 60 * 60 * 1000; // 1 hour

async function cleanupOldFiles(dir) {
  try {
    await fs.ensureDir(dir);
    const files = await fs.readdir(dir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtimeMs > TTL_MS) {
        await fs.remove(filePath);
        console.log(`[Cleanup] Removed expired file: ${file}`);
      }
    }
  } catch (err) {
    console.error('[Cleanup] Error:', err.message);
  }
}

function startCleanupJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cleanup] Running scheduled cleanup...');
    await cleanupOldFiles(DOWNLOADS_DIR);
    await cleanupOldFiles(TEMP_DIR);
  });
  console.log('[Cleanup] Cleanup job scheduled (every 15 min, TTL=1h)');
}

module.exports = { startCleanupJob, cleanupOldFiles };

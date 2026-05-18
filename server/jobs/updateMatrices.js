const cron = require('node-cron');
const recEngine = require('../services/recommendationEngine');

// Rebuild recommendation matrices every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Rebuilding recommendation matrices...`);
  try {
    await recEngine.loadData();
    const stats = recEngine.getStats();
    console.log(`[${new Date().toISOString()}] Matrices updated:`, stats);
  } catch (error) {
    console.error('Error updating matrices:', error);
  }
});

console.log('Background jobs initialized: Matrix refresh every 30 minutes');

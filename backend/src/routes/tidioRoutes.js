const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/apiResponse');

/**
 * Tidio webhook stub — receives events from Tidio if configured.
 * Useful for logging chat events or triggering internal actions
 * when a user contacts support about a transaction.
 */
router.post('/webhook', (req, res) => {
  const { event, visitor, message } = req.body;

  console.log('[Tidio Webhook]', {
    event,
    visitorEmail: visitor?.email,
    message: message?.text?.substring(0, 100),
    timestamp: new Date().toISOString(),
  });

  // Could log to DB, trigger notifications, etc.
  ApiResponse.success(res, { received: true });
});

module.exports = router;

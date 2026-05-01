const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/:transactionId', upload.single('file'), documentController.uploadDocument);
router.get('/:transactionId', documentController.getDocuments);

module.exports = router;

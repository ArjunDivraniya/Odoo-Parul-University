const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

router.get('/', settingsController.getSettings);
router.put('/', authenticateToken, requireRole(['ADMIN']), settingsController.updateSettings);

module.exports = router;

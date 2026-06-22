// backend/src/routes/customer.routes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

router.use(authenticateToken);

// POS & General Operations
router.post('/', customerController.createCustomer);
router.get('/search', customerController.searchCustomers);
router.get('/recent', customerController.getRecentCustomers);

// Admin Only Operations
router.get('/', requireRole(['ADMIN']), customerController.getCustomers);
router.get('/dashboard/stats', requireRole(['ADMIN']), customerController.getCustomerStats);
router.get('/:id', requireRole(['ADMIN']), customerController.getCustomerProfile);
router.put('/:id', requireRole(['ADMIN']), customerController.updateCustomer);

module.exports = router;

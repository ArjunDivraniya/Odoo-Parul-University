const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Protect dashboard - only ADMIN should access
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

router.get('/stats', dashboardController.getStats);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/sales-trends', dashboardController.getSalesTrends);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/heatmap-data', dashboardController.getHeatmapData);
router.get('/employee-performance', dashboardController.getEmployeePerformance);

module.exports = router;

// backend/src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Public: Read products and categories (needed by POS)
router.get('/categories', authenticateToken, productController.getCategories);
router.get('/stats', authenticateToken, productController.getProductsStats);
router.get('/', authenticateToken, productController.getProducts);

// Admin only: CUD operations
router.post('/categories', authenticateToken, requireRole(['ADMIN']), productController.createCategory);
router.delete('/categories/:id', authenticateToken, requireRole(['ADMIN']), productController.deleteCategory);
router.post('/', authenticateToken, requireRole(['ADMIN']), productController.createProduct);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), productController.updateProduct);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), productController.deleteProduct);
router.get("/products",productController.getProducts);

module.exports = router;
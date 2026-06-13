const express = require('express');
const { login, register, signup, me } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateToken, me);

module.exports = router;

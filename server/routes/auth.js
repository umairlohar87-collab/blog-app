const express = require('express');
const ctrl = require('../controllers/authController');
const rules = require('../middleware/rules');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', authLimiter, rules.register, asyncHandler(ctrl.register));
router.post('/login', authLimiter, rules.login, asyncHandler(ctrl.login));
// Logout always clears the cookie, even if the token has already expired.
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;

// Mounted at /api: owns /posts/:id/comments and /comments/:id.
const express = require('express');
const ctrl = require('../controllers/commentController');
const rules = require('../middleware/rules');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/posts/:id/comments', optionalAuth, rules.idParam(), rules.validate, asyncHandler(ctrl.listComments));
router.post('/posts/:id/comments', requireAuth, rules.idParam(), rules.comment, asyncHandler(ctrl.createComment));
router.delete('/comments/:id', requireAuth, rules.idParam(), rules.validate, asyncHandler(ctrl.deleteComment));

module.exports = router;

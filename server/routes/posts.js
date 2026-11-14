const express = require('express');
const ctrl = require('../controllers/postController');
const rules = require('../middleware/rules');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', optionalAuth, rules.listPosts, asyncHandler(ctrl.listPosts));
router.get('/tags', asyncHandler(ctrl.listTags)); // must precede /:id
router.get('/:id', optionalAuth, rules.idParam(), rules.validate, asyncHandler(ctrl.getPost));
router.post('/', requireAuth, rules.post, asyncHandler(ctrl.createPost));
router.put('/:id', requireAuth, rules.idParam(), rules.post, asyncHandler(ctrl.updatePost));
router.delete('/:id', requireAuth, rules.idParam(), rules.validate, asyncHandler(ctrl.deletePost));

module.exports = router;

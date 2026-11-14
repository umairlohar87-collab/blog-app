const express = require('express');
const { query } = require('express-validator');
const ctrl = require('../controllers/userController');
const rules = require('../middleware/rules');
const { optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/:id', rules.idParam(), rules.validate, asyncHandler(ctrl.getUser));
router.get(
  '/:id/posts',
  optionalAuth,
  rules.idParam(),
  ...rules.paginationQuery,
  query('status').optional().isIn(['all', 'draft', 'published']).withMessage('status must be all, draft, or published'),
  rules.validate,
  asyncHandler(ctrl.getUserPosts)
);

module.exports = router;

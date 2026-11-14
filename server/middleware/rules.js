// express-validator chains shared by the route files.
const { body, param, query } = require('express-validator');
const validate = require('./validate');
const { normalizeTags } = require('../utils/helpers');

const idParam = (name = 'id') =>
  param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`).toInt();

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];

const register = [
  body('username')
    .isString().withMessage('Username is required').bail()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters').bail()
    .matches(/^[A-Za-z0-9_]+$/).withMessage('Username may only contain letters, numbers, and underscores'),
  body('email')
    .isString().withMessage('Email is required').bail()
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .isLength({ max: 72 }).withMessage('Password must be at most 72 characters'),
  validate,
];

const login = [
  body('email')
    .isString().withMessage('Email is required').bail()
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email address'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  validate,
];

const post = [
  body('title')
    .isString().withMessage('Title is required').bail()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 characters'),
  body('content')
    .isString().withMessage('Content is required').bail()
    .custom((v) => v.trim().length >= 10).withMessage('Content must be at least 10 characters')
    .isLength({ max: 50000 }).withMessage('Content must be at most 50,000 characters'),
  body('cover_image')
    .optional({ values: 'null' })
    .isString().withMessage('Cover image must be a string').bail()
    .trim()
    .custom((v) => v === '' || /^https?:\/\/[^\s]+$/i.test(v)).withMessage('Cover image must be an http(s) URL')
    .isLength({ max: 2000 }).withMessage('Cover image URL is too long'),
  body('tags')
    .optional({ values: 'null' })
    .custom((v) => Array.isArray(v) || typeof v === 'string').withMessage('Tags must be an array or comma-separated string').bail()
    .custom((v) => normalizeTags(v).length <= 5).withMessage('A post can have at most 5 tags')
    .custom((v) => normalizeTags(v).every((t) => t.length <= 30 && /^[a-z0-9-]+$/.test(t)))
    .withMessage('Tags may only contain letters, numbers, and dashes (max 30 chars each)'),
  body('status')
    .optional()
    .isIn(['draft', 'published']).withMessage('Status must be "draft" or "published"'),
  validate,
];

const listPosts = [
  ...paginationQuery,
  query('status').optional().isIn(['all', 'draft', 'published']).withMessage('status must be all, draft, or published'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search is too long'),
  query('tag').optional().isString().isLength({ max: 30 }).withMessage('tag is too long'),
  query('author').optional().custom((v) => v === 'me' || /^\d+$/.test(v)).withMessage('author must be "me" or a user id'),
  validate,
];

const comment = [
  body('content')
    .isString().withMessage('Comment is required').bail()
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1–1000 characters'),
  validate,
];

module.exports = { idParam, paginationQuery, register, login, post, listPosts, comment, validate };

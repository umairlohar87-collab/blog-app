// Loads environment variables once. The root .env is preferred; server/.env is a fallback.
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';

if (!process.env.JWT_SECRET) {
  if (NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[config] JWT_SECRET not set — using an insecure development default');
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // Relative DB paths are resolved against the server/ directory.
  DB_PATH: path.resolve(__dirname, process.env.DB_PATH || './db/blog.db'),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV,
  IS_PROD: NODE_ENV === 'production',
};

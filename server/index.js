const config = require('./config');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

require('./models/db'); // open DB + apply schema at boot
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
// If deployed behind a reverse proxy, set `app.set('trust proxy', 1)` so the rate limiter
// sees real client IPs. Left off by default so X-Forwarded-For cannot be spoofed.
app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (!config.IS_PROD) app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/comments'));

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.PORT, () => {
    console.log(`API listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
  });
}

module.exports = app;

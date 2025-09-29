process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

console.log('Starting backend (pid=' + process.pid + ') - loading configuration...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const threadsRoutes = require('./routes/threads');
const postsRoutes = require('./routes/posts');
const presenceRoutes = require('./routes/presence');
const reportsRoutes = require('./routes/reports');

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/online', presenceRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/health', (req, res) => res.json({ status: true }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));

module.exports = app;

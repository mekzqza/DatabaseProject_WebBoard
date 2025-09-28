const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Targets - change if your services run on different ports
const FRONTEND_TARGET = process.env.FRONTEND_TARGET || 'http://localhost:8080';
const BACKEND_TARGET = process.env.BACKEND_TARGET || 'http://localhost:3000';

// Proxy /api -> backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_TARGET,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
  logLevel: 'info'
}));

// Proxy other requests -> frontend
app.use('/', createProxyMiddleware({
  target: FRONTEND_TARGET,
  changeOrigin: true,
  logLevel: 'info'
}));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Local proxy listening on http://localhost:${port}`));

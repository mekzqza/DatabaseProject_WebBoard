// Simplified server entry that loads environment and delegates to src/index.js
require('dotenv').config();

// Ensure src/index.js is executed (it constructs and starts the Express app)
require('./src/index');

// Purpose: start the Express app, connect to MongoDB, and wire middleware and routes.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const puzzleRoutes = require('./routes/puzzle.routes');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '16kb' }));
app.use('/api', puzzleRoutes);

async function start() {
  await mongoose.connect(config.mongodbUri);
  app.listen(config.port, () => {
    console.log(`Banana Quiz server listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

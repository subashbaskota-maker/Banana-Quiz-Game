// Purpose: MongoDB schema for one Banana Quiz puzzle. The solution is stored here, never sent to the client.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const mongoose = require('mongoose');

const puzzleSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  solution: { type: Number, required: true },
  solved: { type: Boolean, default: false },
  // TTL index: MongoDB deletes the document 1 hour after createdAt.
  createdAt: { type: Date, default: Date.now, expires: 3600 }
  // Future auth: add userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Puzzle', puzzleSchema);

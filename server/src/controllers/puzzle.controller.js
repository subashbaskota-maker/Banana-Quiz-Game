// Purpose: request handlers for creating a puzzle and checking a guess.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const Puzzle = require('../models/Puzzle');
const { fetchPuzzleFromBananaApi } = require('../services/bananaApi');

// GET /api/puzzle — fetch from Banana API, save, return id + image only.
async function getPuzzle(req, res) {
  const { imageUrl, solution } = await fetchPuzzleFromBananaApi();
  const puzzle = await Puzzle.create({ imageUrl, solution });

  res.json({
    puzzleId: puzzle._id,
    imageUrl: puzzle.imageUrl
  });
}

module.exports = {
  getPuzzle
};

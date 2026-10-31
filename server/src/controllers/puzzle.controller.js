// Purpose: request handlers for creating a puzzle and checking a guess.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
const { fetchPuzzleFromBananaApi } = require('../services/bananaApi');

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

async function getPuzzle(req, res) {
  const { imageUrl, solution } = await fetchPuzzleFromBananaApi();
  const puzzle = await Puzzle.create({ imageUrl, solution, userId: req.user._id });

  res.json({
    puzzleId: puzzle._id,
    imageUrl: puzzle.imageUrl
  });
}

async function submitGuess(req, res) {
  const { puzzleId, guess } = req.body || {};

  if (!isValidObjectId(puzzleId)) {
    throw httpError(400, 'puzzleId must be a valid MongoDB ObjectId.');
  }

  if (typeof guess !== 'number' || !Number.isInteger(guess)) {
    throw httpError(400, 'guess must be an integer (not a string, decimal, or empty value).');
  }

  const puzzle = await Puzzle.findOne({ _id: puzzleId, userId: req.user._id });
  if (!puzzle) {
    throw httpError(404, 'Puzzle not found. It may have expired. Start a new puzzle.');
  }

  if (puzzle.solved) {
    throw httpError(409, 'This puzzle has already been solved. Request a new puzzle.');
  }

  const correct = guess === puzzle.solution;
  if (correct) {
    puzzle.solved = true;
    await puzzle.save();
  }

  res.json({ correct });
}

module.exports = {
  getPuzzle,
  submitGuess
};

// Purpose: request handlers for creating a puzzle and checking a guess.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
const User = require('../models/User');
const { fetchPuzzleFromBananaApi } = require('../services/bananaApi');

const DIFFICULTY_TIME_LIMITS = {
  easy: 60,
  medium: 50,
  hard: 30
};

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

async function getPuzzle(req, res) {
  const difficulty = req.query.difficulty || 'easy';
  const timeLimitSeconds = DIFFICULTY_TIME_LIMITS[difficulty];
  if (typeof timeLimitSeconds !== 'number') {
    throw httpError(400, 'difficulty must be easy, medium, or hard.');
  }

  const { imageUrl, solution } = await fetchPuzzleFromBananaApi();
  const startedAt = new Date();
  const puzzle = await Puzzle.create({
    imageUrl,
    solution,
    userId: req.user._id,
    difficulty,
    startedAt
  });

  res.json({
    puzzleId: puzzle._id,
    imageUrl: puzzle.imageUrl,
    difficulty: puzzle.difficulty,
    startedAt: puzzle.startedAt,
    timeLimitSeconds
  });
}

async function getPuzzleSolution(req, res) {
  const { puzzleId } = req.params;
  if (!isValidObjectId(puzzleId)) {
    throw httpError(400, 'puzzleId must be a valid MongoDB ObjectId.');
  }

  const puzzle = await Puzzle.findOne({ _id: puzzleId, userId: req.user._id });
  if (!puzzle) {
    throw httpError(404, 'Puzzle not found. It may have expired. Start a new puzzle.');
  }

  const timeLimitSeconds = DIFFICULTY_TIME_LIMITS[puzzle.difficulty];
  const deadline = (puzzle.startedAt || puzzle.createdAt).getTime() + timeLimitSeconds * 1000;
  if (Date.now() < deadline) {
    throw httpError(409, 'The puzzle timer has not expired yet.');
  }

  res.json({ solution: puzzle.solution });
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

  const timeLimitSeconds = DIFFICULTY_TIME_LIMITS[puzzle.difficulty];
  const deadline = (puzzle.startedAt || puzzle.createdAt).getTime() + timeLimitSeconds * 1000;
  if (Date.now() >= deadline) {
    throw httpError(409, 'Time is up. The puzzle can no longer be answered.');
  }

  const correct = guess === puzzle.solution;
  if (correct) {
    const updatedPuzzle = await Puzzle.findOneAndUpdate(
      { _id: puzzle._id, solved: false },
      { $set: { solved: true } }
    );
    if (!updatedPuzzle) {
      throw httpError(409, 'This puzzle has already been solved. Request a new puzzle.');
    }
    await User.updateOne({ _id: puzzle.userId }, { $inc: { solvedCount: 1 } });
  }

  res.json({ correct });
}

async function getLeaderboard(req, res) {
  const users = await User.find({ solvedCount: { $gt: 0 } })
    .sort({ solvedCount: -1, createdAt: 1, _id: 1 })
    .limit(10)
    .select('_id solvedCount')
    .lean();

  res.json({
    entries: users.map((user, index) => ({
      rank: index + 1,
      player: `Player ${String(user._id).slice(-4).toUpperCase()}`,
      score: user.solvedCount
    }))
  });
}

module.exports = {
  getPuzzle,
  getPuzzleSolution,
  submitGuess,
  getLeaderboard
};

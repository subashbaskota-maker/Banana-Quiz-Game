// Purpose: map HTTP paths to puzzle controllers. Errors from async handlers go to the error middleware.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const express = require('express');
const { getPuzzle, submitGuess } = require('../controllers/puzzle.controller');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/puzzle', asyncHandler(getPuzzle));
router.post('/guess', asyncHandler(submitGuess));

module.exports = router;

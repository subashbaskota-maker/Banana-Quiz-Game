const express = require('express');
const {
  register,
  login,
  getCurrentUser,
  logout
} = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', asyncHandler(logout));

module.exports = router;
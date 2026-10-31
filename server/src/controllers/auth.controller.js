const { randomBytes } = require('node:crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const { hashPassword, verifyPassword, hashSessionToken } = require('../services/auth');
const { COOKIE_NAME, readSessionToken } = require('../middleware/requireAuth');

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};
const COOKIE_OPTIONS = {
  ...COOKIE_BASE_OPTIONS,
  maxAge: SESSION_DURATION_MS
};

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function getCredentials(body = {}) {
  if (!body || typeof body !== 'object') {
    body = {};
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw httpError(400, 'Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw httpError(400, 'Password must be between 8 and 128 characters.');
  }

  return { email, password };
}

function publicUser(user) {
  return { id: String(user._id), email: user.email };
}

async function startSession(user, res) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await Session.create({
    userId: user._id,
    tokenHash: hashSessionToken(token),
    expiresAt
  });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

async function register(req, res) {
  const { email, password } = getCredentials(req.body);
  let user;
  try {
    user = await User.create({ email, passwordHash: await hashPassword(password) });
  } catch (err) {
    if (err.code === 11000) {
      throw httpError(409, 'An account with that email already exists.');
    }
    throw err;
  }

  await startSession(user, res);
  res.status(201).json({ user: publicUser(user) });
}

async function login(req, res) {
  const { email, password } = getCredentials(req.body);
  const user = await User.findOne({ email });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw httpError(401, 'Email or password is incorrect.');
  }

  await startSession(user, res);
  res.json({ user: publicUser(user) });
}

function getCurrentUser(req, res) {
  res.json({ user: publicUser(req.user) });
}

async function logout(req, res) {
  const token = readSessionToken(req);
  if (token) {
    await Session.deleteOne({ tokenHash: hashSessionToken(token) });
  }
  res.clearCookie(COOKIE_NAME, COOKIE_BASE_OPTIONS);
  res.json({ success: true });
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
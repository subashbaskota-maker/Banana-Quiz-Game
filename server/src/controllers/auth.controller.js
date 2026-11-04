const { randomBytes } = require('node:crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const { hashPassword, verifyPassword, hashSessionToken } = require('../services/auth');
const { COOKIE_NAME, readSessionToken } = require('../middleware/requireAuth');

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const USERNAME_CHANGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
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

function getUsername(value) {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    throw httpError(400, 'Username must be 3–20 characters using only letters, numbers, or underscores.');
  }
  return username;
}

function getCredentials(body = {}, { requireUsername = false } = {}) {
  if (!body || typeof body !== 'object') {
    body = {};
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const username = requireUsername ? getUsername(body.username) : undefined;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw httpError(400, 'Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw httpError(400, 'Password must be between 8 and 128 characters.');
  }
  return { email, password, username };
}

function publicUser(user) {
  const id = String(user._id);
  const username = user.username || `Player ${id.slice(-4).toUpperCase()}`;
  const usernameChangeAvailableAt = user.lastUsernameChangeAt
    ? new Date(user.lastUsernameChangeAt.getTime() + USERNAME_CHANGE_INTERVAL_MS)
    : null;
  return { id, email: user.email, username, usernameChangeAvailableAt };
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
  const { email, password, username } = getCredentials(req.body, { requireUsername: true });
  let user;
  try {
    user = await User.create({ email, username, passwordHash: await hashPassword(password) });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      throw httpError(409, 'An account with that email already exists.');
    }
    if (err.code === 11000 && err.keyPattern?.username) {
      throw httpError(409, 'That username is already taken.');
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

async function updateUsername(req, res) {
  const username = getUsername(req.body?.username);
  if (req.user.username === username) {
    return res.json({ user: publicUser(req.user) });
  }

  const now = new Date();
  const changeAllowedAfter = new Date(now.getTime() - USERNAME_CHANGE_INTERVAL_MS);
  let user;
  try {
    user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        $or: [
          { lastUsernameChangeAt: { $exists: false } },
          { lastUsernameChangeAt: null },
          { lastUsernameChangeAt: { $lte: changeAllowedAfter } }
        ]
      },
      { $set: { username, lastUsernameChangeAt: now } },
      { new: true, runValidators: true }
    );
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.username) {
      throw httpError(409, 'That username is already taken.');
    }
    throw err;
  }

  if (!user) {
    throw httpError(429, 'You can change your username once every 24 hours.');
  }
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
  updateUsername,
  logout
};
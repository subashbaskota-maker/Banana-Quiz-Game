const Session = require('../models/Session');
const User = require('../models/User');
const { hashSessionToken } = require('../services/auth');

const COOKIE_NAME = 'banana_session';

function readSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator !== -1 && cookie.slice(0, separator).trim() === COOKIE_NAME) {
      return cookie.slice(separator + 1).trim();
    }
  }
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = readSessionToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Sign in to continue.' });
    }

    const session = await Session.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() }
    });
    if (!session) {
      return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
    }

    const user = await User.findById(session.userId).select('_id email');
    if (!user) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ error: 'Your session is no longer valid. Sign in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  COOKIE_NAME,
  requireAuth,
  readSessionToken
};
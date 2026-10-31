const { createHash, randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${Buffer.from(derivedKey).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [saltHex, keyHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  if (salt.length !== 16 || expectedKey.length !== 64) {
    return false;
  }

  const actualKey = Buffer.from(await scrypt(password, salt, expectedKey.length));
  return timingSafeEqual(actualKey, expectedKey);
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  hashSessionToken
};
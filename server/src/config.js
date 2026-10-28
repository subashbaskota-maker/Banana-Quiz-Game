// Purpose: load environment variables and stop the process if any required value is missing.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

require('dotenv').config();

// Read one required variable; exit immediately if it was not set.
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

module.exports = {
  mongodbUri: requireEnv('MONGODB_URI'),
  port: Number(process.env.PORT) || 5000,
  bananaApiUrl: requireEnv('BANANA_API_URL'),
  clientOrigin: requireEnv('CLIENT_ORIGIN')
};

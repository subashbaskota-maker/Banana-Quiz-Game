// Purpose: the only module that talks to the external Banana Game API.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

const config = require('../config');

// Custom error so Express can send a 502 without leaking stack traces.
class BananaApiError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'BananaApiError';
    this.statusCode = statusCode;
  }
}

// Fetch one puzzle from the Banana API. Observed JSON fields: question, solution.
async function fetchPuzzleFromBananaApi() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(config.bananaApiUrl, { signal: controller.signal });

    if (!response.ok) {
      throw new BananaApiError(`Banana API returned HTTP ${response.status}.`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new BananaApiError('Banana API did not return valid JSON.');
    }

    // Real field name is "question" (HTTPS image URL), not "imageUrl".
    if (!data || typeof data.question !== 'string' || data.question.trim() === '') {
      throw new BananaApiError('Banana API response was missing a question image URL.');
    }

    const solution = Number(data.solution);
    if (!Number.isFinite(solution)) {
      throw new BananaApiError('Banana API response did not include a numeric solution.');
    }

    return { imageUrl: data.question, solution };
  } catch (err) {
    if (err instanceof BananaApiError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new BananaApiError('Banana API request timed out after 5 seconds.');
    }
    throw new BananaApiError('Could not reach the Banana API.');
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  BananaApiError,
  fetchPuzzleFromBananaApi
};

// Purpose: the only frontend module that calls the Express backend.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Fall through to a generic message if the body is not JSON.
  }
  return `Request failed with status ${response.status}.`;
}

// GET /api/puzzle — returns { puzzleId, imageUrl }.
export async function fetchPuzzle() {
  const response = await fetch('/api/puzzle');
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
}

// POST /api/guess — returns { correct: true|false }.
export async function submitGuess(puzzleId, guess) {
  const response = await fetch('/api/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzleId, guess })
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
}

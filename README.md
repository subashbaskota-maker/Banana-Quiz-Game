# Banana Quiz

A small MERN-stack game for CIS046-3 Software for Enterprise. The player sees an addition puzzle where a banana hides a number, types a guess, and is told whether it is correct.

Portions of this project were generated with AI assistance (Cursor) and reviewed by the author.

## Assumptions

- The Banana API JSON fields are `question` (image) and `solution` (number). This was checked with `curl` against the live API; see `docs/banana-api-sample-response.json`.
- We use the **plain HTTPS image URL**, not `base64=yes`. The image host is HTTPS, so mixed content is not a problem in the React app. Base64 would make responses much larger for no benefit.
- HTTP `http://marcconrad.com/...` redirects to HTTPS; `BANANA_API_URL` is therefore the HTTPS JSON URL.
- MongoDB is local by default (`mongodb://127.0.0.1:27017/banana-quiz`). Atlas works if you put a connection string in `.env`.
- Guess values must be JSON integers. The browser sends a number after client-side validation. String guesses are rejected by the server.
- Auth, scores, timers, and leaderboards are out of scope. The Puzzle schema has a comment where `userId` would go later.

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas cluster
- A browser

## Setup

```bash
cd server
copy .env.example .env
npm install

cd ../client
npm install
```

On macOS/Linux use `cp .env.example .env` instead of `copy`. Edit `server/.env` if your MongoDB URI is not the local default.

## How to run

Terminal 1 — API (port 5000):

```bash
cd server
npm run dev
```

Terminal 2 — React (port 5173, proxies `/api` to port 5000):

```bash
cd client
npm run dev
```

Open http://localhost:5173. Click **Start Game**, type the number the banana stands for, submit, then **Next Puzzle**.

## Endpoints

| Method | Path | Request body | Success response | Notes |
|--------|------|--------------|------------------|--------|
| GET | `/api/health` | — | `{ "status": "ok" }` | Liveness check |
| GET | `/api/puzzle` | — | `{ "puzzleId", "imageUrl" }` | Creates a Puzzle. **Never includes `solution`.** |
| POST | `/api/guess` | `{ "puzzleId", "guess" }` | `{ "correct": true \| false }` | 400 invalid input, 404 missing/expired, 409 already solved |

## Solution never reaches the browser

The Banana API returns the answer in the same JSON as the image. Express stores that answer in MongoDB and only sends `{ puzzleId, imageUrl }` and later `{ correct }`. Confirm in the browser Network tab: `/api/puzzle` and `/api/guess` responses must not contain `solution` or `question`.

## Manual test checklist

1. **Successful puzzle load** — Start Game shows an image and an answer box.
2. **Correct guess** — Submit the right number → “Correct!” and a Next Puzzle button. The form is hidden.
3. **Wrong guess** — Submit a different integer → “Wrong, try again”. You can retry.
4. **Empty / non-numeric guess** — Leave the box empty or type `abc` → inline “Please enter a whole number.” No request is sent.
5. **Invalid puzzleId** — `POST /api/guess` with `"puzzleId": "not-an-id"` → 400 with a clear error message.
6. **Expired / unknown puzzle** — `POST /api/guess` with a valid-looking but unused ObjectId → 404.
7. **Banana API unreachable** — Set `BANANA_API_URL` to `https://127.0.0.1:1/banana` in `.env`, restart the server, click Start Game → UI error, Retry button.
8. **Server down** — Stop the Express process, click Start Game → UI error (not a blank crash), Retry button.

## Project layout

See `docs/architecture.md` for a Mermaid diagram and the get-puzzle / submit-guess data flows.

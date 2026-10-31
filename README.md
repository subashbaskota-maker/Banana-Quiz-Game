# Banana Quiz

A small MERN-stack game for CIS046-3 Software for Enterprise. The player sees an addition puzzle where a banana hides a number, types a guess, and is told whether it is correct.

Portions of this project were generated with AI assistance (Cursor) and reviewed by the author.

## Assumptions

- The Banana API JSON fields are `question` (image) and `solution` (number). This was checked with `curl` against the live API; see `docs/banana-api-sample-response.json`.
- We use the **plain HTTPS image URL**, not `base64=yes`. The image host is HTTPS, so mixed content is not a problem in the React app. Base64 would make responses much larger for no benefit.
- HTTP `http://marcconrad.com/...` redirects to HTTPS; `BANANA_API_URL` is therefore the HTTPS JSON URL.
- MongoDB is local by default (`mongodb://127.0.0.1:27017/banana-quiz`). Atlas works if you put a connection string in `.env`.
- Guess values must be JSON integers. The browser sends a number after client-side validation. String guesses are rejected by the server.
- Players create an account with an email address and password. Passwords are stored as scrypt hashes, and signed-in puzzles belong to that user.
- Login sessions are stored in MongoDB and sent to the browser in an HTTP-only, same-site cookie.

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas cluster
- A browser

## Setup

From the project root:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

Create the server environment file:

```powershell
Copy-Item server/.env.example server/.env
```

On macOS/Linux, use `cp server/.env.example server/.env`. Edit `server/.env` if your MongoDB URI is not the local default.

## How to run

Make sure MongoDB is running, then run this once from the project root:

```bash
npm run dev
```

This starts the Express API on port 5000 and the React/Vite client on port 5173 in the same terminal. They remain separate development processes; Vite proxies `/api` requests to Express.

Open http://localhost:5173. Click **Start Game**, type the number the banana stands for, submit, then **Next Puzzle**.

Create an account or log in before starting a game. The session remains active for up to seven days or until you log out.

## Endpoints

| Method | Path | Request body | Success response | Notes |
|--------|------|--------------|------------------|--------|
| GET | `/api/health` | — | `{ "status": "ok" }` | Liveness check |
| POST | `/api/auth/register` | `{ "email", "password" }` | `{ "user" }` | Creates an account and starts a session |
| POST | `/api/auth/login` | `{ "email", "password" }` | `{ "user" }` | Starts a session |
| GET | `/api/auth/me` | — | `{ "user" }` | Returns the signed-in user |
| POST | `/api/auth/logout` | — | `{ "success": true }` | Revokes the session |
| GET | `/api/puzzle` | — | `{ "puzzleId", "imageUrl" }` | Requires login; creates a user-owned puzzle. **Never includes `solution`.** |
| POST | `/api/guess` | `{ "puzzleId", "guess" }` | `{ "correct": true \| false }` | Requires login; only the puzzle owner can submit. 400 invalid input, 404 missing/expired/not owned, 409 already solved |

## Solution never reaches the browser

The Banana API returns the answer in the same JSON as the image. Express stores that answer in MongoDB and only sends `{ puzzleId, imageUrl }` and later `{ correct }`. Confirm in the browser Network tab: `/api/puzzle` and `/api/guess` responses must not contain `solution` or `question`.

## Manual test checklist

1. **Registration** — Create an account with a valid email and a password of at least 8 characters; the game becomes available.
2. **Login** — Log out, then log in with the same credentials; the account is restored.
3. **Logout** — Log out and refresh; the login form appears and protected API requests return 401.
4. **Puzzle ownership** — A different account cannot submit a guess for another user's puzzle; the API returns 404.
5. **Successful puzzle load** — Start Game shows an image and an answer box.
6. **Correct guess** — Submit the right number → “Correct!” and a Next Puzzle button. The form is hidden.
7. **Wrong guess** — Submit a different integer → “Wrong, try again”. You can retry.
8. **Empty / non-numeric guess** — Leave the box empty or type `abc` → inline “Please enter a whole number.” No request is sent.
9. **Banana API unreachable** — Set `BANANA_API_URL` to `https://127.0.0.1:1/banana` in `.env`, restart the server, click Start Game → UI error, Retry button.
10. **Server down** — Stop the Express process, click Start Game → UI error (not a blank crash), Retry button.

## Project layout

See `docs/architecture.md` for a Mermaid diagram and the get-puzzle / submit-guess data flows.

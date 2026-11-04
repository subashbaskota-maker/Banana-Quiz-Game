# Banana Quiz

A small MERN-stack game for CIS046-3 Software for Enterprise. The player sees an addition puzzle where a banana hides a number, types a guess, and is told whether it is correct.

Portions of this project were generated with AI assistance (Cursor) and reviewed by the author.

## Assumptions

- The Banana API JSON fields are `question` (image) and `solution` (number). This was checked with `curl` against the live API; see `docs/banana-api-sample-response.json`.
- We use the **plain HTTPS image URL**, not `base64=yes`. The image host is HTTPS, so mixed content is not a problem in the React app. Base64 would make responses much larger for no benefit.
- HTTP `http://marcconrad.com/...` redirects to HTTPS; `BANANA_API_URL` is therefore the HTTPS JSON URL.
- MongoDB is local by default (`mongodb://127.0.0.1:27017/banana-quiz`). Atlas works if you put a connection string in `.env`.
- Guess values must be JSON integers. The browser sends a number after client-side validation. String guesses are rejected by the server.
- Players create an account with a username, email address, and password. Usernames are unique and can be changed from the profile page once every 24 hours. Passwords are stored as scrypt hashes, and signed-in puzzles belong to that user.
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

Open http://localhost:5173. Choose a difficulty, click **Start Game**, and solve the puzzle before its timer runs out. Easy gives 60 seconds, medium 50 seconds, and hard 30 seconds. When time runs out, the answer is revealed and you can start the next puzzle or return to the difficulty selection.

Create an account with a username or log in before starting a game. Use the profile icon in the top-right to change your username or log out. Usernames can be changed once every 24 hours. The session remains active for up to seven days or until you log out.

Use the speaker button in the header to play or stop the looping background music. Music starts only after the player turns it on. The track “Game On” by Soft and Furious is CC0/public domain; see [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Soft_and_Furious_-_02_-_Game_On.ogg) and the [CC0 license](https://creativecommons.org/publicdomain/zero/1.0/).

## Endpoints

| Method | Path | Request body | Success response | Notes |
|--------|------|--------------|------------------|--------|
| GET | `/api/health` | — | `{ "status": "ok" }` | Liveness check |
| POST | `/api/auth/register` | `{ "username", "email", "password" }` | `{ "user" }` | Creates an account and starts a session; usernames are 3–20 letters, numbers, or underscores |
| POST | `/api/auth/login` | `{ "email", "password" }` | `{ "user" }` | Starts a session |
| GET | `/api/auth/me` | — | `{ "user" }` | Returns the signed-in user |
| PATCH | `/api/auth/username` | `{ "username" }` | `{ "user" }` | Requires login; username can be changed once every 24 hours; 409 if taken, 429 during cooldown |
| POST | `/api/auth/logout` | — | `{ "success": true }` | Revokes the session |
| GET | `/api/puzzle?difficulty=easy` | — | `{ "puzzleId", "imageUrl", "difficulty", "startedAt", "timeLimitSeconds" }` | Requires login; difficulty is `easy` (60s), `medium` (50s), or `hard` (30s). Creates a user-owned puzzle. **Never includes `solution`.** |
| GET | `/api/puzzle/:puzzleId/solution` | — | `{ "solution": number }` | Requires login and puzzle ownership; only reveals the solution after the server-checked timer expires |
| POST | `/api/guess` | `{ "puzzleId", "guess" }` | `{ "correct": true \| false }` | Requires login; only the puzzle owner can submit. 400 invalid input, 404 missing/expired/not owned, 409 already solved or timer expired |
| GET | `/api/leaderboard` | — | `{ "entries": [{ "rank", "player", "score" }] }` | Requires login; returns the top 10 players by total correctly solved puzzles, shown by username |

## Solution stays hidden until the timer expires

The Banana API returns the answer in the same JSON as the image. Express stores that answer in MongoDB and does not include it in the puzzle response or guess result. The answer is returned by `/api/puzzle/:puzzleId/solution` only after the server verifies that the puzzle's timer has expired.

## Manual test checklist

1. **Registration** — Create an account with a valid username (3–20 letters, numbers, or underscores), email, and password of at least 8 characters; the game becomes available.
2. **Login** — Log out, then log in with the same credentials; the account is restored.
3. **Logout** — Log out and refresh; the login form appears and protected API requests return 401.
4. **Puzzle ownership** — A different account cannot submit a guess for another user's puzzle; the API returns 404.
5. **Successful puzzle load** — Start Game shows an image and an answer box.
6. **Correct guess** — Submit the right number → “Correct!” and a Next Puzzle button. The form is hidden.
7. **Wrong guess** — Submit a different integer → “Wrong, try again”. You can retry.
8. **Empty / non-numeric guess** — Leave the box empty or type `abc` → inline “Please enter a whole number.” No request is sent.
9. **Difficulty timer** — Easy starts at 60 seconds, medium at 50, and hard at 30; the countdown continues while guessing.
10. **Timer expires** — Wait for the countdown to reach zero → submit form disappears, the answer is revealed, and Next Puzzle appears. A guess submitted after expiry is rejected by the server.
11. **Back to difficulty** — Use Back to difficulty during a puzzle → the lobby returns and the selected difficulty remains selected.
12. **Banana API unreachable** — Set `BANANA_API_URL` to `https://127.0.0.1:1/banana` in `.env`, restart the server, click Start Game → UI error, Retry button.
13. **Server down** — Stop the Express process, click Start Game → UI error (not a blank crash), Retry button.
14. **Profile and username** — Open the top-right profile icon, change the username, and verify it appears on the leaderboard; another change is blocked for 24 hours.
15. **Leaderboard** — Open Leaderboard while signed in → top 10 totals appear without exposing account emails; solve a puzzle and reopen it to see the score increase.

## Project layout

See `docs/architecture.md` for a Mermaid diagram and the get-puzzle / submit-guess data flows.

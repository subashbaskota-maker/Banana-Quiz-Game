# Banana Quiz architecture

Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

## Component diagram

```mermaid
flowchart LR
  Player[Player / Browser]
  ReactApp[React client<br/>Vite + functional components]
  ExpressApi[Express server<br/>auth + puzzle routes]
  Mongo[(MongoDB<br/>Users, sessions, puzzles)]
  BananaApi[Banana Game API<br/>marcconrad.com]

  Player --> ReactApp
  ReactApp -->|"HTTP /api (Vite proxy in dev)"| ExpressApi
  ExpressApi -->|"read / write users, sessions, puzzles"| Mongo
  ExpressApi -->|"fetch question + solution"| BananaApi
```

The React app never talks to the Banana API or to MongoDB. The client API modules call Express; only `server/src/services/bananaApi.js` calls the external Banana API.

## Authentication

1. A player registers with an email and password or logs in with existing credentials.
2. The server stores passwords as scrypt hashes. It generates a random session token, stores only its SHA-256 hash in MongoDB, and sets the token in an HTTP-only, same-site cookie.
3. The session lasts up to seven days. The browser sends the cookie with API requests; logout deletes the stored session and clears the cookie.
4. Puzzle and guess routes require a valid session. Each puzzle stores its owner's `userId`, and a player can only submit guesses for their own puzzles.

The auth endpoints are `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`.

## Data flow: get puzzle

1. The player clicks **Start Game** or **Next Puzzle**.
2. `App.jsx` calls `fetchPuzzle()` in `puzzleApi.js`, which sends `GET /api/puzzle`.
3. The Express controller calls `fetchPuzzleFromBananaApi()`.
4. That service requests `BANANA_API_URL` (HTTPS JSON). The observed fields are `question` (image URL) and `solution` (number).
5. Express saves a `Puzzle` document `{ imageUrl, solution, solved: false, createdAt }` in MongoDB.
6. Express responds with `{ puzzleId, imageUrl }` only. `solution` is not included.
7. React stores that object in `puzzle` state and shows the image.

## Data flow: submit guess

1. The player types a whole number and submits the form (`onSubmit` + `preventDefault`).
2. `submitGuess()` sends `POST /api/guess` with `{ puzzleId, guess }`.
3. Express checks that `puzzleId` is a Mongo ObjectId and that `guess` is a JSON integer (not a string, decimal, empty, or NaN).
4. Express loads the Puzzle. Missing or TTL-expired documents return 404.
5. If `solved` is already true, Express returns 409.
6. The guess is compared to the stored `solution`. A correct guess sets `solved = true`.
7. Express responds with `{ correct: true }` or `{ correct: false }`. The solution is never returned.
8. React shows **Correct!** or **Wrong, try again**. After a correct answer the form is hidden and **Next Puzzle** is shown.

## Why the solution stays on the server

The Banana API includes the answer in the same payload as the image. If that payload reached the browser, a player could read the solution in the Network tab. Storing `solution` only in MongoDB, and returning `{ puzzleId, imageUrl }` / `{ correct }`, means the client can play honestly. The Puzzle TTL (1 hour) also drops unused answers automatically.


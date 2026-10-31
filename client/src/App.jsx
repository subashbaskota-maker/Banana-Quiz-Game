// Purpose: hold game state and coordinate start, guess, result, and next-puzzle flow.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

import { useEffect, useState } from 'react';
import { getCurrentUser, login, logout, register } from './api/authApi.js';
import { fetchPuzzle, fetchPuzzleSolution, submitGuess } from './api/puzzleApi.js';
import AuthForm from './components/AuthForm.jsx';
import PuzzleView from './components/PuzzleView.jsx';
import GuessForm from './components/GuessForm.jsx';
import ResultMessage from './components/ResultMessage.jsx';

const DIFFICULTY_TIME_LIMITS = { easy: 60, medium: 50, hard: 30 };

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [revealedSolution, setRevealedSolution] = useState(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState(null);
  const [solutionRetry, setSolutionRetry] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(false);

  useEffect(() => {
    if (!puzzle || result === 'correct' || timeExpired) {
      return undefined;
    }

    const deadline = Date.parse(puzzle.startedAt) + puzzle.timeLimitSeconds * 1000;
    function updateTimer() {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        setTimeExpired(true);
      }
    }

    updateTimer();
    const intervalId = setInterval(updateTimer, 250);
    return () => clearInterval(intervalId);
  }, [puzzle, result, timeExpired]);

  useEffect(() => {
    if (!puzzle || !timeExpired || revealedSolution !== null) {
      return undefined;
    }

    let active = true;
    setSolutionLoading(true);
    setSolutionError(null);
    fetchPuzzleSolution(puzzle.puzzleId)
      .then(({ solution }) => {
        if (active) {
          setRevealedSolution(solution);
        }
      })
      .catch((err) => {
        if (active) {
          setSolutionError(err.message || 'Could not reveal the solution.');
        }
      })
      .finally(() => {
        if (active) {
          setSolutionLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [puzzle, timeExpired, revealedSolution, solutionRetry]);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch((err) => {
        if (active) {
          setAuthError(err.message || 'Could not check your sign-in status.');
        }
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleAuthSubmit(credentials) {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const response = authMode === 'register'
        ? await register(credentials.email, credentials.password)
        : await login(credentials.email, credentials.password);
      setUser(response.user);
    } catch (err) {
      setAuthError(err.message || 'Could not authenticate.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await logout();
      setUser(null);
      setAuthMode('login');
      setPuzzle(null);
      setGuess('');
      setResult(null);
      setError(null);
      setRemainingSeconds(null);
      setTimeExpired(false);
      setRevealedSolution(null);
    } catch (err) {
      setAuthError(err.message || 'Could not log out.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function loadPuzzle() {
    setLoading(true);
    setError(null);
    setResult(null);
    setGuess('');
    setRemainingSeconds(null);
    setTimeExpired(false);
    setRevealedSolution(null);
    setSolutionError(null);
    setPuzzle(null);
    try {
      const data = await fetchPuzzle(selectedDifficulty);
      setPuzzle(data);
    } catch (err) {
      setPuzzle(null);
      setError(err.message || 'Could not load a puzzle. Check that the server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitGuess(numericGuess) {
    if (!puzzle || timeExpired) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitGuess(puzzle.puzzleId, numericGuess);
      setResult(data.correct ? 'correct' : 'wrong');
      if (data.correct) {
        setTimeExpired(false);
        setRevealedSolution(null);
      }
    } catch (err) {
      setError(err.message || 'Could not check your guess.');
    } finally {
      setSubmitting(false);
    }
  }

  function returnToDifficultySelection() {
    setPuzzle(null);
    setGuess('');
    setResult(null);
    setError(null);
    setRemainingSeconds(null);
    setTimeExpired(false);
    setRevealedSolution(null);
    setSolutionError(null);
  }

  const showStart = user && !puzzle && !loading && !error;
  const showForm = puzzle && result !== 'correct';

  return (
    <main className="app">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Banana Quiz home">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>Banana Quiz<small>Think it. Solve it.</small></span>
        </a>
        <div className="header-actions">
          <button
            className={`music-toggle${musicEnabled ? ' music-enabled' : ''}`}
            type="button"
            aria-label={musicEnabled ? 'Turn music off' : 'Turn music on'}
            aria-pressed={musicEnabled}
            data-tooltip={musicEnabled ? 'Turn music off' : 'Turn music on'}
            onClick={() => setMusicEnabled((enabled) => !enabled)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4Z" />
              {musicEnabled && (
                <>
                  <path d="M16 9a5 5 0 0 1 0 6" />
                  <path d="M18.5 6.5a8.5 8.5 0 0 1 0 11" />
                </>
              )}
              {!musicEnabled && <path className="mute-slash" d="m16 9 5 6m0-6-5 6" />}
            </svg>
          </button>
          <button className="leaderboard-button" type="button" disabled title="Leaderboard coming soon">
            Leaderboard <span>Coming soon</span>
          </button>
        </div>
      </header>

      {musicEnabled && (
        <aside className="music-player" aria-label="Background music player">
          <div className="music-player-heading">
            <strong>Background music</strong>
            <span>Provided by YouTube</span>
          </div>
          <iframe
            src="https://www.youtube-nocookie.com/embed/WIit0NbgRpQ?autoplay=1&controls=1&playsinline=1"
            title="YouTube music video"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </aside>
      )}

      <section className="game-card">
        <div className="game-heading">
          <p className="eyebrow">A LITTLE BRAIN TRAINING</p>
          <h1>What number does the banana stand for?</h1>
          <p className="tagline">Look at the puzzle, work it out, and enter your answer.</p>
        </div>

        {checkingSession && <p className="status-message">Checking sign-in…</p>}

        {!checkingSession && !user && (
          <AuthForm
            mode={authMode}
            onModeChange={(mode) => {
              setAuthMode(mode);
              setAuthError(null);
            }}
            onSubmit={handleAuthSubmit}
            busy={authBusy}
            error={authError}
          />
        )}

        {!checkingSession && user && (
          <div className="account-bar">
            <p>Signed in as <strong>{user.email}</strong></p>
            <button className="text-button" type="button" onClick={handleLogout} disabled={authBusy}>
              {authBusy ? 'Please wait…' : 'Log out'}
            </button>
          </div>
        )}

        {user && authError && <p className="auth-error" role="alert">{authError}</p>}

        {showStart && (
          <div className="game-lobby">
            <div className="difficulty-picker">
              <div>
                <h2>Choose your difficulty</h2>
                <p>Pick a level. Each puzzle has its own countdown.</p>
              </div>
              <div className="difficulty-options" role="group" aria-label="Choose a difficulty">
                {Object.entries(DIFFICULTY_TIME_LIMITS).map(([difficulty, seconds]) => (
                  <button
                    className={`difficulty-option${selectedDifficulty === difficulty ? ' selected' : ''}`}
                    type="button"
                    key={difficulty}
                    aria-pressed={selectedDifficulty === difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                  >
                    <span>{difficulty}</span>
                    <small>{seconds} seconds</small>
                  </button>
                ))}
              </div>
            </div>
            <button className="primary-button start-button" type="button" onClick={loadPuzzle}>
              Start Game <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {user && loading && <p className="status-message">Loading puzzle…</p>}

        {user && error && (
          <div className="error-box" role="alert">
            <p>{error}</p>
            <button className="primary-button" type="button" onClick={loadPuzzle}>
              Retry
            </button>
            <button className="text-button" type="button" onClick={returnToDifficultySelection}>
              Back to difficulty
            </button>
          </div>
        )}

        {user && puzzle && !loading && (
          <div className="puzzle-stage">
            <div className="game-toolbar">
              <button className="text-button back-button" type="button" onClick={returnToDifficultySelection}>
                ← Back to difficulty
              </button>
              {result !== 'correct' && !timeExpired && (
                <p className={`countdown${(remainingSeconds ?? puzzle.timeLimitSeconds) <= 10 ? ' countdown-warning' : ''}`}
                  role="timer"
                  aria-label={`${remainingSeconds ?? puzzle.timeLimitSeconds} seconds remaining`}>
                  <span aria-hidden="true">⏱</span> {remainingSeconds ?? puzzle.timeLimitSeconds}s
                </p>
              )}
            </div>
            <PuzzleView imageUrl={puzzle.imageUrl} />
            {showForm && !timeExpired && (
              <GuessForm
                guess={guess}
                onGuessChange={setGuess}
                onSubmitGuess={handleSubmitGuess}
                submitting={submitting}
              />
            )}
            <ResultMessage result={result} />
            {timeExpired && (
              <div className="timeout-message" role="status">
                <h2>Time’s up!</h2>
                {solutionLoading && <p>Revealing the answer…</p>}
                {solutionError && (
                  <>
                    <p className="auth-error">{solutionError}</p>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setSolutionRetry((attempt) => attempt + 1)}
                    >
                      Try revealing the answer again
                    </button>
                  </>
                )}
                {revealedSolution !== null && (
                  <p>The solution was: <strong>{revealedSolution}</strong></p>
                )}
              </div>
            )}
            {(result === 'correct' || timeExpired) && (
              <button className="primary-button" type="button" onClick={loadPuzzle}>
                Next Puzzle <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        )}
      </section>
      <footer className="app-footer">One puzzle at a time. You’ve got this.</footer>
    </main>
  );
}

export default App;

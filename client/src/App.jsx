// Purpose: hold game state and coordinate start, guess, result, and next-puzzle flow.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

import { useEffect, useState } from 'react';
import { getCurrentUser, login, logout, register } from './api/authApi.js';
import { fetchPuzzle, submitGuess } from './api/puzzleApi.js';
import AuthForm from './components/AuthForm.jsx';
import PuzzleView from './components/PuzzleView.jsx';
import GuessForm from './components/GuessForm.jsx';
import ResultMessage from './components/ResultMessage.jsx';

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
    try {
      const data = await fetchPuzzle();
      setPuzzle(data);
    } catch (err) {
      setPuzzle(null);
      setError(err.message || 'Could not load a puzzle. Check that the server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitGuess(numericGuess) {
    if (!puzzle) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitGuess(puzzle.puzzleId, numericGuess);
      setResult(data.correct ? 'correct' : 'wrong');
    } catch (err) {
      setError(err.message || 'Could not check your guess.');
    } finally {
      setSubmitting(false);
    }
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
        <button className="leaderboard-button" type="button" disabled title="Leaderboard coming soon">
          Leaderboard <span>Coming soon</span>
        </button>
      </header>

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
                <p>Pick a level to get ready. Difficulty rules are coming later.</p>
              </div>
              <div className="difficulty-options" role="group" aria-label="Choose a difficulty">
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <button
                    className={`difficulty-option${selectedDifficulty === difficulty ? ' selected' : ''}`}
                    type="button"
                    key={difficulty}
                    aria-pressed={selectedDifficulty === difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                  >
                    {difficulty}
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
          </div>
        )}

        {user && puzzle && !loading && (
          <div className="puzzle-stage">
            <PuzzleView imageUrl={puzzle.imageUrl} />
            {showForm && (
              <GuessForm
                guess={guess}
                onGuessChange={setGuess}
                onSubmitGuess={handleSubmitGuess}
                submitting={submitting}
              />
            )}
            <ResultMessage result={result} />
            {result === 'correct' && (
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

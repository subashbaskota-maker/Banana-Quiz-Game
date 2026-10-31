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
      <h1>Banana Quiz</h1>
      <p className="tagline">What number does the banana stand for?</p>

      {checkingSession && <p>Checking sign-in…</p>}

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
          <button type="button" onClick={handleLogout} disabled={authBusy}>
            {authBusy ? 'Please wait…' : 'Log out'}
          </button>
        </div>
      )}

      {user && authError && <p className="auth-error" role="alert">{authError}</p>}

      {showStart && <button type="button" onClick={loadPuzzle}>Start Game</button>}

      {user && loading && <p>Loading puzzle…</p>}

      {user && error && (
        <div className="error-box">
          <p>{error}</p>
          <button type="button" onClick={loadPuzzle}>
            Retry
          </button>
        </div>
      )}

      {user && puzzle && !loading && (
        <>
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
            <button type="button" onClick={loadPuzzle}>
              Next Puzzle
            </button>
          )}
        </>
      )}
    </main>
  );
}

export default App;

// Purpose: hold game state and coordinate start, guess, result, and next-puzzle flow.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

import { useState } from 'react';
import { fetchPuzzle, submitGuess } from './api/puzzleApi.js';
import PuzzleView from './components/PuzzleView.jsx';
import GuessForm from './components/GuessForm.jsx';
import ResultMessage from './components/ResultMessage.jsx';

function App() {
  const [puzzle, setPuzzle] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const showStart = !puzzle && !loading && !error;
  const showForm = puzzle && result !== 'correct';

  return (
    <main className="app">
      <h1>Banana Quiz</h1>
      <p className="tagline">What number does the banana stand for?</p>

      {showStart && (
        <button type="button" onClick={loadPuzzle}>
          Start Game
        </button>
      )}

      {loading && <p>Loading puzzle…</p>}

      {error && (
        <div className="error-box">
          <p>{error}</p>
          <button type="button" onClick={loadPuzzle}>
            Retry
          </button>
        </div>
      )}

      {puzzle && !loading && (
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

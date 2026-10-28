// Purpose: controlled numeric guess form. Submit is handled in JavaScript, not by a page reload.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

import { useState } from 'react';

function GuessForm({ guess, onGuessChange, onSubmitGuess, submitting }) {
  const [validationMessage, setValidationMessage] = useState('');

  // Event-driven programming: the browser fires a submit event; we intercept it
  // with preventDefault() so the page does not reload, then we validate and call the parent.
  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = String(guess).trim();
    if (trimmed === '' || !/^-?\d+$/.test(trimmed)) {
      setValidationMessage('Please enter a whole number.');
      return;
    }
    setValidationMessage('');
    onSubmitGuess(Number(trimmed));
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <label htmlFor="guess-input">Your answer</label>
      <input
        id="guess-input"
        type="text"
        inputMode="numeric"
        value={guess}
        onChange={(e) => onGuessChange(e.target.value)}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Checking…' : 'Submit'}
      </button>
      {validationMessage && <p className="inline-error">{validationMessage}</p>}
    </form>
  );
}

export default GuessForm;

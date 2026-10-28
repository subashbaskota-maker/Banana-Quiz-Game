// Purpose: show Correct! or Wrong, try again after a guess is checked.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

function ResultMessage({ result }) {
  if (!result) {
    return null;
  }

  if (result === 'correct') {
    return <p className="result result-correct">Correct!</p>;
  }

  return <p className="result result-wrong">Wrong, try again</p>;
}

export default ResultMessage;

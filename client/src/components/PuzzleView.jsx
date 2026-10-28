// Purpose: show the puzzle image with alt text and a loading state.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

import { useState, useEffect } from 'react';

function PuzzleView({ imageUrl }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  return (
    <div className="puzzle-view">
      {!imageLoaded && <p className="image-loading">Loading puzzle image…</p>}
      <img
        src={imageUrl}
        alt="Banana quiz puzzle: find the number the banana stands for"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(true)}
        className={imageLoaded ? 'puzzle-image' : 'puzzle-image puzzle-image-hidden'}
      />
    </div>
  );
}

export default PuzzleView;

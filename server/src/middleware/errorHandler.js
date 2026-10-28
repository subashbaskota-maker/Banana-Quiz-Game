// Purpose: turn thrown errors into { error: "message" } JSON and never leak stack traces.
// Portions of this file were generated with AI assistance (Cursor) and reviewed by the author.

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message =
    err.statusCode && err.message ? err.message : 'Something went wrong.';

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;

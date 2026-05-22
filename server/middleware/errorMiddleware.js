const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid resource id';
  }

  if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map(error => error.message).join(', ');
  }

  res.status(status).json({
    status,
    message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

module.exports = errorMiddleware;

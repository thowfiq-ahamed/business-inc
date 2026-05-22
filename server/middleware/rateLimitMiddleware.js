function createRateLimiter({ windowMs, max, message }) {
  const attempts = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.method}:${req.baseUrl}${req.route?.path || req.path}`;
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    attempts.set(key, current);

    if (attempts.size > 10000) {
      attempts.forEach((value, storedKey) => {
        if (value.resetAt <= now) attempts.delete(storedKey);
      });
    }

    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        message,
        retryAfter,
      });
    }

    return next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: 'Too many password reset attempts. Please try again later.',
});

const contactLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many contact submissions. Please try again later.',
});

module.exports = {
  createRateLimiter,
  authLimiter,
  passwordResetLimiter,
  contactLimiter,
};

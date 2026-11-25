const requestCounts = new Map();

function rateLimiter(maxRequests, windowMs) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (requestCounts.get(key) || []).filter(t => t > windowStart);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please wait.' });
    }

    timestamps.push(now);
    requestCounts.set(key, timestamps);
    next();
  };
}

module.exports = rateLimiter;
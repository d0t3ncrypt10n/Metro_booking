// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // Max 5 OTP requests per window

/**
 * Rate limiter middleware
 */
export function rateLimiter(req, res, next) {
  const identifier = req.body.phone || req.ip;
  const now = Date.now();

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }

  const requests = requestCounts.get(identifier);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }

  // Add current request
  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);

  next();
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [identifier, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (recentRequests.length === 0) {
      requestCounts.delete(identifier);
    } else {
      requestCounts.set(identifier, recentRequests);
    }
  }
}, RATE_LIMIT_WINDOW);

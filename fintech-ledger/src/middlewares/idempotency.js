import { redisClient } from '../config/redis.js';

export const checkIdempotency = async (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) {
    // Allow requests without idempotency for non-idempotent tests/clients.
    return next();
  }

  // Extract user ID from authenticated request context
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      error: 'User context missing - authentication required for idempotency',
    });
  }

  // Scope the idempotency key per-user to isolate cached responses
  const scopedKey = `${userId}:${key}`;

  try {
    // Skip if Redis is not ready
    if (!redisClient.isOpen) {
      console.warn('Redis not connected, skipping idempotency check');
      return next();
    }

    const cachedResponse = await redisClient.get(`idempotency:${scopedKey}`);
    if (cachedResponse) {
      console.log(`Hit Idempotency Key for user ${userId}: ${key}`);
      // Return the saved result immediately! Do not run the transfer logic again.
      return res.json(JSON.parse(cachedResponse));
    }
    // Hook into res.json to save the result AFTER the controller finishes
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful or specific failure responses
      if (res.statusCode >= 200 && res.statusCode < 300 && redisClient.isOpen) {
        redisClient
          .set(
            `idempotency:${scopedKey}`,
            JSON.stringify(body),
            { EX: 60 * 60 * 24 } // Cache for 24 hours
          )
          .catch((err) => console.error('Failed to cache response:', err));
      }
      // Call the original response function
      return originalJson.call(res, body);
    };
    next();
  } catch (err) {
    console.error('Redis Error:', err);
    next(); // Fail open: If Redis dies, just process the request normally
  }
};

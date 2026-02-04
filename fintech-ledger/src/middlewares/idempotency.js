import { redisClient } from "../config/redis.js";

export const checkIdempotency = async (req, res, next) => {
  const key = req.headers["idempotency-key"];
  if (!key) {
    return res
      .status(400)
      .json({ error: "Idempotency-Key header is required" });
  }
  try {
    // Skip if Redis is not ready
    if (!redisClient.isOpen) {
      console.warn("Redis not connected, skipping idempotency check");
      return next();
    }

    const cachedResponse = await redisClient.get(`idempotency:${key}`);
    if (cachedResponse) {
      console.log(`Hit Idempotency Key: ${key}`);
      // Return the saved result immediately! Do not run the transfer logic again.
      return res.json(JSON.parse(cachedResponse));
    }
    // Hook into res.json to save the result AFTER the controller finishes
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful or specific failure responses
      if (res.statusCode >= 200 && res.statusCode < 300 && redisClient.isOpen) {
        redisClient.set(
          `idempotency:${key}`,
          JSON.stringify(body),
          { EX: 60 * 60 * 24 }, // Cache for 24 hours
        ).catch(err => console.error("Failed to cache response:", err));
      }
      // Call the original response function
      return originalJson.call(res, body);
    };
    next();
  } catch (err) {
    console.error("Redis Error:", err);
    next(); // Fail open: If Redis dies, just process the request normally
  }
};

import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6969"
});

await redis.connect(); // Top-level await; wrap this if using CommonJS

export function idempotencyMiddleware(ttlSeconds = 3600) {
  return async (req, res, next) => {
    const key = req.header("Idempotency-Key");
    if (!key) return next();

    const prev = await redis.get(key);
    if (prev) {
      // Duplicate request
      const data = JSON.parse(prev);
      return res.status(409).json({ error: "Duplicate request", ...data });
    }

    // Patch res.json to store response in Redis
    const oldJson = res.json;
    res.json = async function (data) {
      await redis.setEx(key, ttlSeconds, JSON.stringify(data));
      return oldJson.call(this, data);
    };
    next();
  };
}
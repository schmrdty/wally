// A simple in-memory store. For production, use Redis or DB!
const idempotencyStore = {};

export function idempotencyMiddleware(req, res, next) {
  const key = req.header("Idempotency-Key");
  if (!key) return next();

  if (idempotencyStore[key]) {
    // Prevent duplicate processing, return previous response
    return res.status(409).json({ error: "Duplicate request", ...idempotencyStore[key] });
  }

  // Monkey-patch res.json to store response
  const oldJson = res.json;
  res.json = function (data) {
    idempotencyStore[key] = data;
    return oldJson.call(this, data);
  };
  next();
}
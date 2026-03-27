import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import { BadRequestError } from "./common/utils/index.js";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
  throw BadRequestError({ message: "ARCJET_KEY environment variable is missing" });
}

// HTTP protection
export const httpArcjet = arcjet({
  key: arcjetKey,
  rules: [
    shield({ mode: arcjetMode }),
    detectBot({
      mode: arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
    slidingWindow({
      mode: arcjetMode,
      interval: "10s",
      max: 50,
    }),
  ],
});

// WebSocket protection
export const wsArcjet = arcjet({
  key: arcjetKey,
  rules: [
    shield({ mode: arcjetMode }),
    detectBot({
      mode: arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
    slidingWindow({
      mode: arcjetMode,
      interval: "2s",
      max: 5,
    }),
  ],
});

// Middleware
export function securityMiddleware() {
  return async (req, res, next) => {
    try {
      const decision = await httpArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({
            error_message: "Too many requests",
            reason: decision.reason,
          });
        }
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      console.error("Arcjet middleware error:", error);
      return res.status(503).json({ message: "Server unavailable" });
    }
  };
}
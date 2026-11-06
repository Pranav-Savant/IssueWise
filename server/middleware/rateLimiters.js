import rateLimit from "express-rate-limit";

export const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many analysis requests. Please try again after 15 minutes.",
  },
});

export const summarizeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many summary requests. Please try again after 15 minutes.",
  },
});

export const githubLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many GitHub requests. Please try again after 15 minutes.",
  },
});

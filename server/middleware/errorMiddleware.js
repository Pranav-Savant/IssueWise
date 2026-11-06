export default function errorMiddleware(err, req, res, next) {
  console.error("Unhandled server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "An unexpected server error occurred.",
  });
}
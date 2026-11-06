import express from "express";
import cors from "cors";
import summaryRoutes from "./routes/summaryRoutes.js";
import githubRoutes from "./routes/githubRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import "dotenv/config";
import { analyzeLimiter, summarizeLimiter, githubLimiter } from "./middleware/rateLimiters.js";

const requiredEnvVars = ["GITHUB_TOKEN", "GROQ_API_KEY"];

for (const name of requiredEnvVars) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}
const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

app.use(express.json());
app.use("/api/summarize", summarizeLimiter, summaryRoutes);
app.use("/api/github", githubLimiter, githubRoutes);
app.use("/api/analyze", analyzeLimiter, analyzeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "IssueWise API is running" });
});
app.use(errorMiddleware);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`IssueWise server running on port ${PORT}`);
});

import { analyzeRepository } from "../services/analyzeService.js";

export async function analyzeRepositoryController(req, res) {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        error: "Repository URL is required.",
      });
    }

    const result = await analyzeRepository(repoUrl);

    return res.json(result);
  } catch (error) {
    console.error("Repository analysis failed:", error.message);

    return res.status(error.statusCode || 502).json({
      error: error.statusCode
        ? error.message
        : "Analysis service unavailable.",
      ...(error.details ? { details: error.details } : {}),
    });
  }
}

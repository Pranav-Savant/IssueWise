import { generateIssueSummary } from "../services/groqService.js";

export async function summarizeIssue(req, res) {
  try {
    const { title, description } = req.body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        message: "A valid title and description are required.",
      });
    }

    const summary = await generateIssueSummary(title, description);

    return res.json({ summary });
  } catch (error) {
    console.error("Summarization failed:", {
      message: error.message,
      status: error.status,
      code: error.error?.code,
    });

    return res.status(error.statusCode || 502).json({
      message: "Unable to summarize this issue right now.",
    });
  }
}
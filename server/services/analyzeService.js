
import { fetchRepositoryIssues } from "./githubService.js";

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

function createError(message, statusCode, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details !== undefined) error.details = details;
  return error;
}

export async function analyzeRepository(repoUrl) {
  const { data: githubData } = await fetchRepositoryIssues(repoUrl);

  const mlResponse = await fetch(
    `${ML_SERVICE_URL}/api/repository/similarities`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        top_n: 5,
        issues: githubData.issues,
      }),
    }
  );

  const mlData = await mlResponse.json();

  if (!mlResponse.ok) {
    throw createError(
      "Similarity analysis failed.",
      502,
      mlData.detail || mlData.error
    );
  }

  return {
    repository: githubData.repository,
    count: githubData.count,
    issues: mlData.results,
  };
}

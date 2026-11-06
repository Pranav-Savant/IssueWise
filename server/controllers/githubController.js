import { fetchRepositoryIssues } from "../services/githubService.js";

export async function getRepositoryIssues(req, res) {
  try {
    const { data, cacheStatus } = await fetchRepositoryIssues(
      req.query.repoUrl
    );

    res.set("X-Cache", cacheStatus);

    return res.json(data);
  } catch (error) {
    console.error("GitHub issue fetching failed:", error.message);

    return res.status(error.statusCode || 500).json({
      error:
        error.statusCode
          ? error.message
          : "An unexpected error occurred while fetching issues.",
    });
  }
}
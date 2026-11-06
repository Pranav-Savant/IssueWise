const PER_PAGE = 100;
const MAX_ISSUES = 500;
const CACHE_TTL = 10 * 60 * 1000;

const issueCache = new Map();

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseRepositoryUrl(repoUrl) {
  if (!repoUrl || typeof repoUrl !== "string") {
    throw createError("Repository URL is required.", 400);
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(repoUrl);
  } catch {
    throw createError("Invalid repository URL.", 400);
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "github.com" ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.port
  ) {
    throw createError(
      "Please provide a valid GitHub repository URL.",
      400
    );
  }

  const parts = parsedUrl.pathname.split("/").filter(Boolean);

  if (
    parts.length !== 2 ||
    parts.some((part) => part === "." || part === "..")
  ) {
    throw createError(
      "Use a URL like https://github.com/owner/repository",
      400
    );
  }

  return parts;
}

export async function fetchRepositoryIssues(repoUrl) {
  const [owner, repo] = parseRepositoryUrl(repoUrl);

  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

  const cached = issueCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    console.log(`Issue cache HIT: ${cacheKey}`);
    return { data: cached.data, cacheStatus: "HIT" };
  }

  if (cached) {
    issueCache.delete(cacheKey);
  }

  console.log(`Issue cache MISS: ${cacheKey}`);

  const issues = [];

  let nextUrl = new URL(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`
  );

  nextUrl.searchParams.set("state", "all");
  nextUrl.searchParams.set("per_page", String(PER_PAGE));

  let truncated = false;

  while (nextUrl && issues.length < MAX_ISSUES) {
    const response = await fetch(nextUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "IssueWise",
      },
    });

    if (!response.ok) {
      console.log(
        "Rate limit remaining:",
        response.headers.get("x-ratelimit-remaining")
      );
      console.log(
        "Rate limit reset:",
        response.headers.get("x-ratelimit-reset")
      );
      console.log(
        "Retry after:",
        response.headers.get("retry-after")
      );

      const details = await response.text();

      console.error("GitHub API error:", {
        status: response.status,
        details,
        url: nextUrl.toString(),
      });

      if (response.status === 404) {
        throw createError(
          "Repository not found or inaccessible.",
          404
        );
      }

      if (response.status === 403 || response.status === 429) {
        throw createError(
          "GitHub API rate limit reached or access denied.",
          429
        );
      }

      throw createError(
        "Failed to fetch issues from GitHub.",
        502
      );
    }

    const githubIssues = await response.json();

    const formattedIssues = githubIssues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body ?? "",
        state: issue.state,
        url: issue.html_url,
        labels: issue.labels.map((label) => label.name),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      }));

    const remaining = MAX_ISSUES - issues.length;
    issues.push(...formattedIssues.slice(0, remaining));

    const linkHeader = response.headers.get("link");
    const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    const followingUrl = nextMatch?.[1] ?? null;

    if (followingUrl) {
      const candidate = new URL(followingUrl);

      if (
        candidate.protocol !== "https:" ||
        candidate.hostname !== "api.github.com"
      ) {
        throw new Error("Unexpected pagination URL from GitHub.");
      }
    }

    truncated =
      issues.length >= MAX_ISSUES && followingUrl !== null;

    nextUrl =
      issues.length < MAX_ISSUES && followingUrl
        ? new URL(followingUrl)
        : null;

    if (githubIssues.length === 0) {
      truncated = false;
      break;
    }
  }

  const data = {
    repository: `${owner}/${repo}`,
    count: issues.length,
    issues,
    truncated,
    limit: MAX_ISSUES,
  };

  issueCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return { data, cacheStatus: "MISS" };
}

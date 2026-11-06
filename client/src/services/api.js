const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export async function analyzeRepository(repoUrl) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repoUrl }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to analyze repository."
    );
  }

  return data;
}

export async function summarizeIssue(title, description) {
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, description }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to summarize issue."
    );
  }

  return data;
}

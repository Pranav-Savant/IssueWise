
import { useState } from "react";
import { analyzeRepository } from "../services/api.js";

export default function useRepositoryAnalysis() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  async function handleAnalyze(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const data = await analyzeRepository(repoUrl.trim());
      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Failed to analyze repository.");
    } finally {
      setLoading(false);
    }
  }

  return {
    repoUrl,
    setRepoUrl,
    loading,
    error,
    analysis,
    handleAnalyze,
  };
}

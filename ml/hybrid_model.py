import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


print("Loading semantic model...")

model = SentenceTransformer("all-MiniLM-L6-v2")

print("Semantic model loaded.")



def find_repository_similarities(
    issues,
    top_n=5,
    semantic_weight=0.7,
):
    """
    Find the most similar issues within one GitHub repository.

    Each issue should contain:
    number, title, body, url
    """

    if not issues:
        return []

    if len(issues) == 1:
        issue = issues[0]

        return [{
            "number": issue["number"],
            "title": issue.get("title", ""),
            "body": issue.get("body", ""),
            "url": issue.get("url", ""),
            "labels": issue.get("labels", []),
            "state": issue.get("state"),
            "createdAt": issue.get("createdAt"),
            "similar_issues": [],
        }]

    texts = []

    for issue in issues:
        title = issue.get("title") or ""
        body = issue.get("body") or ""

        texts.append(f"{title}. {title}. {body}")

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=10000,
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(texts)
        tfidf_scores = cosine_similarity(tfidf_matrix)
    except ValueError:
        tfidf_scores = np.zeros(
            (len(issues), len(issues))
        )

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    )

    semantic_scores = cosine_similarity(embeddings)

    hybrid_scores = (
        semantic_weight * semantic_scores
        + (1 - semantic_weight) * tfidf_scores
    )

    np.fill_diagonal(hybrid_scores, -1)

    results = []

    for i, issue in enumerate(issues):
        top_indices = np.argsort(
            hybrid_scores[i]
        )[::-1][:min(top_n, len(issues) - 1)]

        similar_issues = []

        for j in top_indices:
            similar_issues.append({
                "number": issues[j]["number"],
                "title": issues[j].get("title", ""),
                "url": issues[j].get("url", ""),
                "semantic_score": round(
                    float(semantic_scores[i, j]), 4
                ),
                "tfidf_score": round(
                    float(tfidf_scores[i, j]), 4
                ),
                "hybrid_score": round(
                    float(hybrid_scores[i, j]), 4
                ),
            })

        results.append({
            "number": issue["number"],
            "title": issue.get("title", ""),
            "body": issue.get("body", ""),
            "url": issue.get("url", ""),
            "labels": issue.get("labels", []),
            "state": issue.get("state"),
            "createdAt": issue.get("createdAt"),
            "similar_issues": similar_issues,
        })

    return results

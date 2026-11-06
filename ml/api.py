from predict_label import predict_issue_label
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from priority_model import predict_priority
from hybrid_model import find_repository_similarities

app = FastAPI(title="IssueWise ML API")

class RepositoryIssue(BaseModel):
    number: int
    title: str
    body: str = ""
    url: str = ""
    labels: list[str] = Field(default_factory=list)
    state: str | None = None
    createdAt: str | None = None

class RepositorySimilarityRequest(BaseModel):
    issues: list[RepositoryIssue]
    top_n: int = Field(default=5, ge=1, le=10)



@app.get("/")
def health_check():
    return {"message": "IssueWise ML API is running"}


@app.post("/api/repository/similarities")
def analyze_repository(request: RepositorySimilarityRequest):
    if not request.issues:
        raise HTTPException(
            status_code=400,
            detail="At least one repository issue is required.",
        )

    if any(not issue.title.strip() for issue in request.issues):
        raise HTTPException(
            status_code=400,
            detail="Every issue must have a title.",
        )

    try:
        issues = [
            issue.model_dump()
            for issue in request.issues
        ]

        results = find_repository_similarities(
            issues=issues,
            top_n=request.top_n,
        )

        for result in results:
            priority_prediction = predict_priority(
                title=result["title"],
                body=result.get("body", ""),
            )
            
            result["suggested_priority"] = priority_prediction["priority"]
            result["priority_reason"] = priority_prediction["reason"]
            original_labels = result.get("labels", [])
        
            original_label_names = [
                label["name"] if isinstance(label, dict) else label
                for label in original_labels
            ]
        
            prediction = predict_issue_label(
                title=result["title"],
                body=result.get("body", ""),
            )
        
            predicted_label = prediction["predicted_label"]
        
            result["original_labels"] = original_label_names
            result["predicted_label"] = predicted_label
            result["category_scores"] = prediction["category_scores"]
        
        return {
            "count": len(results),
            "results": results,
        }

    except Exception as error:
        print(f"Repository similarity analysis failed: {error}")
        raise HTTPException(
            status_code=500,
            detail="Repository similarity analysis failed.",
        )

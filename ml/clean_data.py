import pandas as pd
import re
from pathlib import Path

DATA_DIR = Path("data")
INPUT_FILE = DATA_DIR / "raw_issues.csv"
OUTPUT_FILE = DATA_DIR / "clean_issues.csv"


def clean_text(text):
    """Normalize issue text while preserving useful information."""
    if pd.isna(text):
        return ""

    text = str(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def main():
    df = pd.read_csv(INPUT_FILE)

    initial_count = len(df)

    df = df.drop_duplicates(subset=["issue_id"], keep="first")

    df["title"] = df["title"].fillna("").astype(str).str.strip()
    df = df[df["title"] != ""].copy()

    df["title"] = df["title"].apply(clean_text)
    df["body"] = df["body"].apply(clean_text)

    df["labels"] = df["labels"].fillna("[]").astype(str)

    df["search_text"] = (
        df["title"] + "\n" + df["body"]
    ).str.strip()

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")

    print("\nIssueWise Data Cleaning Summary")
    print("-" * 35)
    print(f"Original issues:       {initial_count}")
    print(f"After deduplication:   {initial_count - df['issue_id'].duplicated().sum()}")
    print(f"Final cleaned issues:  {len(df)}")
    print(f"Empty bodies retained: {(df['body'] == '').sum()}")
    print(f"Missing titles:        {(df['title'] == '').sum()}")
    print(f"Duplicate issue IDs:   {df['issue_id'].duplicated().sum()}")
    print(f"\nSaved to: {OUTPUT_FILE.resolve()}")
    print(f"Final shape: {df.shape}")


if __name__ == "__main__":
    main()

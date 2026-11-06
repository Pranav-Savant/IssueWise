import os
import json
import time
import calendar
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests


REPOSITORIES = [
    "pallets/flask",
    "psf/requests",
    "fastapi/fastapi",
    "pandas-dev/pandas",
    "scikit-learn/scikit-learn",
]

MAX_ISSUES_PER_REPO = 1000
PER_PAGE = 100
REQUEST_DELAY = 2.1
MAX_RETRIES = 5

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_PATH = OUTPUT_DIR / "raw_issues.csv"

COLUMNS = [
    "repository",
    "issue_id",
    "number",
    "title",
    "body",
    "labels",
    "state",
    "created_at",
    "updated_at",
    "html_url",
]

token = os.getenv("GITHUB_TOKEN")

if not token:
    raise RuntimeError(
        "GITHUB_TOKEN is missing. Set it in this terminal "
        "before running the collector."
    )

session = requests.Session()
session.headers.update({
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {token}",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "IssueWise-ML-Project",
})

SEARCH_URL = "https://api.github.com/search/issues"



def load_data():
    if not OUTPUT_PATH.exists():
        return pd.DataFrame(columns=COLUMNS)

    df = pd.read_csv(OUTPUT_PATH, dtype={"issue_id": "string"})

    for column in COLUMNS:
        if column not in df.columns:
            df[column] = None

    df = df[COLUMNS].copy()
    df["issue_id"] = df["issue_id"].astype("string")
    df = df.drop_duplicates(subset=["issue_id"], keep="last")

    return df.reset_index(drop=True)


def save_data(df):
    temp_path = OUTPUT_PATH.with_suffix(".tmp")

    df.to_csv(temp_path, index=False)
    os.replace(temp_path, OUTPUT_PATH)


def issue_row(repository, issue):
    return {
        "repository": repository,
        "issue_id": str(issue["id"]),
        "number": issue["number"],
        "title": issue.get("title") or "",
        "body": issue.get("body") or "",
        "labels": json.dumps([
            label["name"]
            for label in issue.get("labels", [])
        ]),
        "state": issue.get("state", ""),
        "created_at": issue.get("created_at", ""),
        "updated_at": issue.get("updated_at", ""),
        "html_url": issue.get("html_url", ""),
    }



def search_page(query, page):
    params = {
        "q": query,
        "per_page": PER_PAGE,
        "page": page,
        "sort": "created",
        "order": "desc",
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = session.get(
                SEARCH_URL,
                params=params,
                timeout=30,
            )

            if response.status_code in (403, 429):
                remaining = response.headers.get(
                    "X-RateLimit-Remaining"
                )
                reset = response.headers.get("X-RateLimit-Reset")
                retry_after = response.headers.get("Retry-After")

                if retry_after:
                    wait = int(retry_after) + 2
                elif remaining == "0" and reset:
                    wait = max(int(reset) - int(time.time()) + 3, 3)
                else:
                    wait = min(60 * (attempt + 1), 300)

                if attempt == MAX_RETRIES - 1:
                    response.raise_for_status()

                print(
                    f"GitHub rate limit or request restriction. "
                    f"Waiting {wait} seconds..."
                )
                time.sleep(wait)
                continue

            response.raise_for_status()
            data = response.json()

            time.sleep(REQUEST_DELAY)
            return data

        except (requests.RequestException, ValueError) as error:
            if attempt == MAX_RETRIES - 1:
                raise RuntimeError(
                    f"GitHub search failed: {error}"
                ) from error

            wait = min(2 ** (attempt + 1), 30)
            print(f"Request failed: {error}")
            print(f"Retrying in {wait} seconds...")
            time.sleep(wait)

    raise RuntimeError("Could not fetch search results.")



def split_date_range(start, end):
    """Split an inclusive date range into two non-overlapping ranges."""
    midpoint = start + timedelta(days=(end - start).days // 2)

    return [
        (start, midpoint),
        (midpoint + timedelta(days=1), end),
    ]


def month_windows():
    """Yield monthly windows from the current month backwards."""
    today = date.today()
    current_year = today.year
    current_month = today.month

    while (current_year, current_month) >= (2010, 1):
        first_day = date(current_year, current_month, 1)

        if current_year == today.year and current_month == today.month:
            last_day = today
        else:
            last_day = date(
                current_year,
                current_month,
                calendar.monthrange(
                    current_year, current_month
                )[1],
            )

        yield first_day, last_day

        current_month -= 1
        if current_month == 0:
            current_month = 12
            current_year -= 1



def collect_window(repository, start, end, df, existing_ids):
    """
    Collect one date range. If GitHub reports over 1,000
    search results, split the date range before paging.
    """

    if start > end:
        return df, existing_ids

    if df[df["repository"] == repository]["issue_id"].nunique() \
            >= MAX_ISSUES_PER_REPO:
        return df, existing_ids

    query = (
        f"repo:{repository} is:issue "
        f"created:{start.isoformat()}..{end.isoformat()}"
    )

    first_page = search_page(query, 1)
    total_count = first_page.get("total_count", 0)

    if total_count > 1000:
        if start == end:
            raise RuntimeError(
                f"{repository} has over 1,000 search results "
                f"on {start}. A smaller time partition is needed."
            )

        print(
            f"{repository}: {start} to {end} has "
            f"{total_count} results; splitting date range."
        )

        for sub_start, sub_end in split_date_range(start, end):
            df, existing_ids = collect_window(
                repository, sub_start, sub_end, df, existing_ids
            )

            if df[df["repository"] == repository]["issue_id"].nunique() \
                    >= MAX_ISSUES_PER_REPO:
                break

        return df, existing_ids

    pages = (total_count + PER_PAGE - 1) // PER_PAGE

    for page_number in range(1, pages + 1):
        if page_number == 1:
            page_data = first_page
        else:
            page_data = search_page(query, page_number)

        added = 0

        for issue in page_data.get("items", []):
            if "pull_request" in issue:
                continue

            issue_id = str(issue["id"])

            if issue_id in existing_ids:
                continue

            repo_count = df[
                df["repository"] == repository
            ]["issue_id"].nunique()

            if repo_count >= MAX_ISSUES_PER_REPO:
                break

            new_row = pd.DataFrame(
                [issue_row(repository, issue)],
                columns=COLUMNS,
            )

            df = pd.concat(
                [df, new_row],
                ignore_index=True,
            )

            existing_ids.add(issue_id)
            added += 1

        save_data(df)

        repo_count = df[
            df["repository"] == repository
        ]["issue_id"].nunique()

        print(
            f"{repository} | {start} to {end} | "
            f"page {page_number}/{pages} | "
            f"new: {added} | total: {repo_count}/"
            f"{MAX_ISSUES_PER_REPO}"
        )

        if repo_count >= MAX_ISSUES_PER_REPO:
            break

    return df, existing_ids



def main():
    df = load_data()

    existing_ids = set(
        df["issue_id"].dropna().astype(str)
    )

    print("Existing unique issues:", len(existing_ids))
    print("Using authenticated GitHub API.")
    print("Target: up to 1,000 issues per repository.")

    for repository in REPOSITORIES:
        current_count = df[
            df["repository"] == repository
        ]["issue_id"].nunique()

        print(f"\nCollecting {repository}: {current_count}/1000")

        if current_count >= MAX_ISSUES_PER_REPO:
            print("Target already reached. Skipping.")
            continue

        try:
            for start, end in month_windows():
                current_count = df[
                    df["repository"] == repository
                ]["issue_id"].nunique()

                if current_count >= MAX_ISSUES_PER_REPO:
                    break

                df, existing_ids = collect_window(
                    repository, start, end, df, existing_ids
                )

            print(
                f"Finished {repository}: "
                f"{df[df['repository'] == repository]['issue_id'].nunique()} "
                f"unique issues."
            )

        except (RuntimeError, requests.RequestException) as error:
            print(f"\nStopped for {repository}: {error}")
            print("Saved data is preserved.")
            print("Run the script again later to resume.")
            break

    df = load_data()

    print("\nCollection summary")
    print("------------------")
    print("Total unique issues:", df["issue_id"].nunique())
    print("Saved to:", OUTPUT_PATH)
    print("\nIssues per repository:")
    print(
        df.groupby("repository")["issue_id"]
        .nunique()
        .sort_values(ascending=False)
        .to_string()
    )


if __name__ == "__main__":
    main()

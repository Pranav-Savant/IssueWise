import re


def predict_priority(title, body=""):
    text = f"{title} {body}".lower()

    high_priority_patterns = [
        r"\bcritical\b",
        r"\bblocker\b",
        r"\b(severe|major)\s+(crash|failure|outage|vulnerability)\b",
        r"\bcrash(?:es|ed|ing)?\b",
        r"\bdata loss\b",
        r"\bsecurity vulnerability\b",
        r"\b(production|service|system)\s+outage\b",
        r"\bcompletely unusable\b",
        r"\b(all|every)\s+(requests?|users?|services?)\s+(fail|failed|failing)\b",
        r"\b(remote code execution|privilege escalation)\b",
    ]

    medium_priority_patterns = [
        r"\bbug\b",
        r"\berror\b",
        r"\bfails?\b",
        r"\bfailed\b",
        r"\bfailing\b",
        r"\bexception\b",
        r"\btimeout\b",
        r"\bincorrect(?:ly)?\b",
        r"\bnot working\b",
        r"\bperformance\b",
        r"\bregression\b",
        r"\bunexpected behavior\b",
    ]

    negation_patterns = [
        r"\bno\s+(?:longer\s+)?crash(?:es|ed|ing)?\b",
        r"\bdoes not crash\b",
        r"\bdoesn't crash\b",
        r"\bnot reproducible\b",
        r"\bcannot reproduce\b",
        r"\bunable to reproduce\b",
        r"\bresolved\b",
        r"\bhas been fixed\b",
        r"\bnot an issue\b",
    ]

    normalized_text = re.sub(r"\s+", " ", text)

    if any(re.search(pattern, normalized_text) for pattern in negation_patterns):
        priority = "Low"
        reason = (
            "The issue description contains a resolution, negation, "
            "or non-reproducibility signal; verify manually."
        )

    elif any(
        re.search(pattern, normalized_text)
        for pattern in high_priority_patterns
    ):
        priority = "High"
        reason = (
            "The issue mentions a potentially critical failure "
            "or severe impact."
        )

    elif any(
        re.search(pattern, normalized_text)
        for pattern in medium_priority_patterns
    ):
        priority = "Medium"
        reason = (
            "The issue mentions a potential bug, error, regression, "
            "timeout, or functional problem."
        )

    else:
        priority = "Low"
        reason = (
            "No strong indicators of an urgent or significant failure "
            "were detected."
        )

    return {
        "priority": priority,
        "reason": reason,
    }


if __name__ == "__main__":
    title = input("Enter issue title: ").strip()
    body = input("Enter issue description: ").strip()

    result = predict_priority(title, body)

    print(f"\nSuggested priority: {result['priority']}")
    print(f"Reason: {result['reason']}")

import argparse
import json
import csv
import sys
import os
import pandas as pd
from datetime import datetime

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from verifier.engine import CitationVerifier

def main():
    parser = argparse.ArgumentParser(description="Sentinel Prime Batch Verifier Harness")
    parser.add_argument("--input", required=True, help="Input JSON file with test cases")
    parser.add_argument("--output", default="verification_report.csv", help="Output CSV report path")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"[-] Input file not found: {args.input}")
        sys.exit(1)

    with open(args.input, 'r') as f:
        test_cases = json.load(f)

    print(f"[*] Loaded {len(test_cases)} test cases.")
    print(f"[*] Region: ap-south-1 (simulated)")

    verifier = CitationVerifier()
    results = []
    
    correct_verifications = 0
    total_valid_citations = 0
    hallucinations_caught = 0
    total_hallucinations = 0

    for case in test_cases:
        source_id = case.get("source_id")
        snippet = case.get("snippet")
        expected_status = case.get("expected_status") # PASS or BLOCKED
        
        # Run Verification
        res = verifier.verify(source_id, snippet)
        actual_status = res["status"]
        score = res.get("score", 0.0)

        # Metrics Logic
        is_match = (actual_status == expected_status)
        
        if expected_status == "PASS":
            total_valid_citations += 1
            if is_match: correct_verifications += 1
        
        if expected_status == "BLOCKED":
            total_hallucinations += 1
            if is_match: hallucinations_caught += 1

        results.append({
            "test_id": case.get("id"),
            "source_id": source_id,
            "snippet_preview": snippet[:50] + "...",
            "expected": expected_status,
            "actual": actual_status,
            "match_score": score,
            "result": "SUCCESS" if is_match else "FAILURE",
            "method": res.get("verification_method", "N/A")
        })

    # Save CSV
    df = pd.DataFrame(results)
    df.to_csv(args.output, index=False)
    
    # Calculate Summary Metrics
    accuracy = (correct_verifications + hallucinations_caught) / len(test_cases) if test_cases else 0
    citation_accuracy = correct_verifications / total_valid_citations if total_valid_citations else 0
    false_citation_rate = (total_hallucinations - hallucinations_caught) / total_hallucinations if total_hallucinations else 0

    print("\n" + "="*40)
    print("SENTINEL PRIME VERIFICATION REPORT")
    print("="*40)
    print(f"Total Cases processed: {len(test_cases)}")
    print(f"Overall Accuracy:      {accuracy:.2%}")
    print(f"Citation Validity:     {citation_accuracy:.2%}")
    print(f"Hallucination Catch:   {hallucinations_caught}/{total_hallucinations}")
    print("-" * 40)
    print(f"Report saved to: {args.output}")

    # Acceptance Criteria Check (Dev)
    if accuracy >= 0.98:
        print("[+] STATUS: PASS (Accuracy >= 98%)")
        sys.exit(0)
    else:
        print("[-] STATUS: FAIL (Accuracy < 98%)")
        sys.exit(1)

if __name__ == "__main__":
    main()

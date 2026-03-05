import argparse
import json
import sys
import os

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from verifier.engine import CitationVerifier

def main():
    parser = argparse.ArgumentParser(description="Sentinel Prime Citation Verifier CLI")
    parser.add_argument("--source", required=True, help="Source ID (e.g., GFR_2017)")
    parser.add_argument("--text", required=True, help="Text snippet to verify")
    parser.add_argument("--threshold", type=float, default=85.0, help="Fuzzy match threshold (0-100)")
    
    args = parser.parse_args()
    
    verifier = CitationVerifier()
    
    print(f"[*] Verifying against Source: {args.source}")
    print(f"[*] Input Text: \"{args.text}\"")
    
    result = verifier.verify(args.source, args.text, threshold=args.threshold)
    
    print(json.dumps(result, indent=2))
    
    if result["status"] == "BLOCKED":
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main()

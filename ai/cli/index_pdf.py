import argparse
import json
import sys
import os

# Add parent dir to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parser.indexer import TenderParser

def main():
    parser = argparse.ArgumentParser(description="Sentinel Prime PDF Parser CLI")
    parser.add_argument("input_pdf", help="Path to the input PDF file")
    parser.add_argument("--tender-id", help="Optional Tender ID", default=None)
    parser.add_argument("--output", help="Output JSON file path", default="output.json")
    
    args = parser.parse_args()
    
    print(f"[*] Starting analysis for: {args.input_pdf}")
    print(f"[*] Region: ap-south-1 (simulated storage)")
    
    try:
        indexer = TenderParser()
        clauses = indexer.parse(args.input_pdf, args.tender_id)
        
        with open(args.output, "w") as f:
            json.dump(clauses, f, indent=2)
            
        print(f"[+] Success! Extracted {len(clauses)} clauses.")
        print(f"[+] Output saved to: {args.output}")
        print(f"[+] SHA256: {clauses[0]['source_sha256'] if clauses else 'N/A'}")
        
    except Exception as e:
        print(f"[-] Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

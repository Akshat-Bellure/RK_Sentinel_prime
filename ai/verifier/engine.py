import hashlib
from rapidfuzz import fuzz
from .store import CitationStore

class CitationVerifier:
    def __init__(self, kb_path: str = None):
        self.store = CitationStore()
        # kb_path can be used to load external JSON dumps in future

    def verify(self, source_id: str, snippet: str, page: int = None, threshold: float = 85.0):
        """
        Verifies a citation snippet against a source document.
        Algorithm:
        1. Exact Substring Search (Fast)
        2. Fuzzy Partial Ratio Search (Levenshtein based)
        """
        source_doc = self.store.get_source(source_id)
        
        if not source_doc:
            return {
                "status": "BLOCKED",
                "verification_method": "NONE",
                "reason": f"Source ID '{source_id}' not found in Citation Store.",
                "legal_ticket": "TKT-MISSING-SOURCE"
            }

        source_text = source_doc["content"]
        snippet_clean = " ".join(snippet.split())
        source_clean = " ".join(source_text.split())

        # 1. Exact Match
        if snippet_clean in source_clean:
            return {
                "status": "PASS",
                "verification_method": "EXACT_SUBSTRING",
                "score": 100.0,
                "source_sha256": source_doc["sha256"],
                "page": page
            }

        # 2. Fuzzy Match
        # partial_ratio finds the best matching substring
        score = fuzz.partial_ratio(snippet_clean, source_clean)
        
        if score >= threshold:
            return {
                "status": "PASS",
                "verification_method": "FUZZY_MATCH",
                "score": score,
                "source_sha256": source_doc["sha256"],
                "note": "Minor deviation detected but semantically aligned."
            }

        # 3. Block / Hallucination Detected
        return {
            "status": "BLOCKED",
            "verification_method": "FUZZY_MATCH",
            "score": score,
            "reason": "Citation text does not match source document (Hallucination Risk).",
            "legal_ticket": f"TKT-HALLUCINATION-{hashlib.sha256(snippet.encode()).hexdigest()[:8]}"
        }

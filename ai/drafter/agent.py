import json
import hashlib
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from verifier.engine import CitationVerifier

class DrafterAgent:
    def __init__(self, model="llama-3-70b-instruct"):
        self.model = model
        self.verifier = CitationVerifier(kb_path="../data/kb_index")
        with open(os.path.join(os.path.dirname(__file__), "../prompts/drafter_prompt.txt"), "r") as f:
            self.prompt_template = f.read()

    def draft(self, clause_text: str, strategy: dict, tone: str):
        # 1. Prepare Context
        # In a real LLM, we would format the prompt here.
        # prompt = self.prompt_template.format(clause_text=clause_text, strategist_json=json.dumps(strategy), tone=tone)
        
        # 2. Simulate LLM Generation based on Strategy & Tone
        draft_content = self._simulate_llm_generation(clause_text, strategy, tone)
        
        # 3. Post-Processing Verification
        requires_review = False
        verified_citations = []
        
        if strategy.get("risk_level") == "CRITICAL" and not strategy.get("citations"):
            requires_review = True

        # Verify inline citations if present in the simulated text
        # (For this mock, we just check the strategy citations against the verifier)
        for cit in strategy.get("citations", []):
            verify_result = self.verifier.verify(cit["source_id"], cit["line_snippet"], cit.get("page"))
            if verify_result["status"] != "PASS":
                requires_review = True
            else:
                verified_citations.append(cit)

        return {
            "draft_text": draft_content,
            "tone": tone,
            "citations": verified_citations,
            "requires_legal_review": requires_review,
            "generated_at": "2023-10-27T16:00:00Z"
        }

    def _simulate_llm_generation(self, clause, strategy, tone):
        citations = strategy.get("citations", [])
        cit_str = ""
        c = {"source_id": "UNKNOWN", "sha256": "000", "page": 0}
        
        if citations:
            c = citations[0]
            # [source_id|sha256|page|line_snip_hash]
            snip_hash = hashlib.sha256(c["line_snippet"].encode()).hexdigest()[:8]
            cit_str = f"[{c['source_id']}|{c['sha256']}|{c['page']}|{snip_hash}]"

        if tone == "concise":
            return f"Clause '{clause[:20]}...' violates {c['source_id']} guidelines. {cit_str} Request immediate amendment to align with local content norms."
        elif tone == "officer-friendly":
            return f"Regarding '{clause[:20]}...', we humbly request the Authority to clarify if this aligns with {c['source_id']}. {cit_str} Amending this would encourage broader participation from domestic bidders."
        else: # formal
            return f"Reference: '{clause[:20]}...'.\nObservation: The quoted clause appears to be in contravention of {c['source_id']}.\nEvidence: {cit_str}\nRequest: We respectfully submit that the clause be rectified to ensure compliance."

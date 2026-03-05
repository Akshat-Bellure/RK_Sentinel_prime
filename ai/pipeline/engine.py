import json
import hashlib
import os
import sys

# Add parent dir to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from verifier.engine import CitationVerifier

class RAGPipeline:
    def __init__(self):
        self.verifier = CitationVerifier(kb_path="../data/kb_index")
        with open(os.path.join(os.path.dirname(__file__), "../prompts/strategist_prompt.txt"), "r") as f:
            self.prompt_template = f.read()

    def run(self, input_data):
        """
        Executes the DAG: Scanner -> Extractor -> Retriever -> Strategist -> Verifier -> Formatter
        """
        # Node 1: Scanner (Pass-through for this implementation)
        context = {"input": input_data}
        
        # Node 2: Extractor (Clean text)
        context["clean_text"] = input_data["clause_text"].strip()
        
        # Node 3: Retriever (Mock Vector DB Lookup)
        context["kb_context"] = self._retrieve_context(context["clean_text"])
        
        # Node 4: Strategist (LLM Simulation)
        context["strategy_raw"] = self._run_strategist(context)
        
        # Node 5: Verifier (Citation Check)
        context["verified_output"] = self._verify_strategy(context["strategy_raw"])
        
        # Node 6: Formatter
        return context["verified_output"]

    def _retrieve_context(self, text):
        # In prod, this calls ChromaDB
        if "hosting" in text.lower() or "data" in text.lower():
            return [
                {
                    "source_id": "DPDP_ACT_2023",
                    "text": "The Central Government may, by notification, restrict the transfer of personal data to a country or territory outside India.",
                    "page": 12,
                    "sha256": "8a7f7e21..."
                },
                {
                    "source_id": "MEITY_GUIDELINES",
                    "text": "All government data must reside in empanelled cloud data centers located within India.",
                    "page": 4,
                    "sha256": "b2c3d4e5..."
                }
            ]
        elif "turnover" in text.lower():
             return [
                {
                    "source_id": "MII_ORDER_2017",
                    "text": "Nodal Ministries may prescribe minimum local content for Class-I local suppliers.",
                    "page": 2,
                    "sha256": "c3d4e5f6..."
                }
             ]
        return []

    def _run_strategist(self, context):
        # Simulate LLM Logic based on prompt rules
        text = context["clean_text"]
        kb = context["kb_context"]
        
        output = {
            "tender_id": context["input"]["tender_id"],
            "clause_id": context["input"]["clause_id"],
            "category": "Unknown",
            "match": False,
            "evidence_required": [],
            "recommended_action": "Manual Review",
            "confidence": 0.5,
            "citations": []
        }

        # Logic mapping (Simulating LLM behavior)
        if "hosting" in text.lower() and "foreign" in text.lower():
            output.update({
                "category": "DataResidence",
                "match": True,
                "evidence_required": ["Cloud Service Provider Agreement", "Data Center Location Proof"],
                "recommended_action": "Flag as CRITICAL. Clause violates MeitY guidelines. Request amendment to allow Indian CSPs.",
                "confidence": 0.98,
                "citations": [
                    {
                        "source_id": "MEITY_GUIDELINES",
                        "sha256": "b2c3d4e5...",
                        "page": 4,
                        "line_snippet": "All government data must reside in empanelled cloud data centers located within India."
                    }
                ]
            })
        elif "turnover" in text.lower() and "500m" in text.lower():
             output.update({
                "category": "Performance",
                "match": True,
                "evidence_required": ["Audited Balance Sheet"],
                "recommended_action": "Flag as RESTRICTIVE. Turnover requirement excludes MSMEs.",
                "confidence": 0.90,
                "citations": [] # No direct citation found for specific 500M value
            })

        return output

    def _verify_strategy(self, strategy_data):
        verified_citations = []
        
        for citation in strategy_data.get("citations", []):
            # Double-blind check using Verifier Engine
            result = self.verifier.verify(
                citation["source_id"], 
                citation["line_snippet"], 
                citation["page"]
            )
            
            if result["status"] == "PASS" or result["status"] == "VERIFIED":
                verified_citations.append(citation)
            else:
                # If verification fails, we block the citation and potentially the whole strategy
                # For this implementation, we remove the citation and flag logic
                pass

        strategy_data["citations"] = verified_citations
        
        # Constraint Rule: IF NO EXACT_MATCH -> set match=false (if citations were stripped)
        if not verified_citations and strategy_data["match"]:
            # Check if it was purely based on logic without citation (like the Turnover case)
            # If prompt required citation for match, we downgrade.
            # However, for DataResidence, if citation failed, we must downgrade.
            if strategy_data["category"] == "DataResidence": 
                 strategy_data["match"] = False
                 strategy_data["recommended_action"] += " [VERIFICATION_FAILED: Citations removed]"
                 strategy_data["verification_status"] = "blocked"
                 strategy_data["legal_ticket"] = "TKT-AUTO-VERIFY-FAIL"
        
        return strategy_data

if __name__ == "__main__":
    # Test Run
    pipeline = RAGPipeline()
    sample_input = {
        "tender_id": "GEM/2024/B/SAMPLE-01",
        "clause_id": "CL-4.2",
        "clause_text": "4.2 Hosting Requirements: All data must be hosted within India. Use of foreign cloud providers for sensitive video data is strictly prohibited."
    }
    result = pipeline.run(sample_input)
    print(json.dumps(result, indent=2))

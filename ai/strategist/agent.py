class StrategistAgent:
    def __init__(self, model):
        self.model = model

    def run(self, clause_text, metadata):
        # Mock Logic for Strategist
        if "hosting" in clause_text.lower():
            return {
                "category": "DATA_RESIDENCY",
                "risk_level": "CRITICAL",
                "recommendation": "File Pre-Bid Query referencing DPDP Act 2023."
            }
        return {
            "category": "GENERAL",
            "risk_level": "LOW",
            "recommendation": "No action required."
        }

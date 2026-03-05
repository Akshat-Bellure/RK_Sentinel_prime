import hashlib
from typing import Optional, Dict

class CitationStore:
    def __init__(self):
        # In a real system, this would connect to Postgres/ElasticSearch in ap-south-1
        # For the pilot, we load verified texts into memory.
        self._store: Dict[str, Dict] = {
            "GFR_2017": {
                "source_id": "GFR_2017",
                "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", # Placeholder
                "pdf_filename": "General_Financial_Rules_2017.pdf",
                "content": """
Rule 144: Fundamental principles of public buying.
(xi) Any bidder from a country which shares a land border with India will be eligible to bid in any procurement whether of goods, services (including consultancy services and non-consultancy services) or works (including turnkey projects) only if the bidder is registered with the Competent Authority.
                """.strip()
            },
            "DPDP_ACT_2023": {
                "source_id": "DPDP_ACT_2023",
                "sha256": "8a7f7e2198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "pdf_filename": "Digital_Personal_Data_Protection_Act_2023.pdf",
                "content": """
Section 16: Processing of personal data outside India.
(1) The Central Government may, by notification, restrict the transfer of personal data by a Data Fiduciary for processing to such country or territory outside India as may be so notified.
                """.strip()
            },
            "MEITY_CLOUD_GUIDELINES": {
                "source_id": "MEITY_CLOUD_GUIDELINES",
                "sha256": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
                "pdf_filename": "MeitY_Cloud_Empanelment_Guidelines.pdf",
                "content": """
2.1 Data Location: The Cloud Service Provider shall guarantee that all Government Data resides in data centers located within the territorial jurisdiction of India.
                """.strip()
            }
        }

    def get_source(self, source_id: str) -> Optional[Dict]:
        return self._store.get(source_id)

    def add_source(self, source_id: str, content: str, filename: str):
        sha = hashlib.sha256(content.encode('utf-8')).hexdigest()
        self._store[source_id] = {
            "source_id": source_id,
            "sha256": sha,
            "pdf_filename": filename,
            "content": content
        }

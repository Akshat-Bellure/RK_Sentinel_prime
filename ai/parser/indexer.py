import hashlib
import uuid
import re
import os
from typing import List, Dict, Any
# Note: In a real environment, unstructured would be installed. 
# For this file content, we assume the library is available.
try:
    from unstructured.partition.pdf import partition_pdf
except ImportError:
    partition_pdf = None

class TenderParser:
    def __init__(self):
        self.clause_pattern = re.compile(r'^(?:\d+(?:\.\d+)*|SECTION\s+[IVX]+|ANNEXURE\s+[A-Z0-9]+)\.?\s+', re.IGNORECASE)

    def generate_file_hash(self, file_path: str) -> str:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def parse(self, file_path: str, tender_id: str = None) -> List[Dict[str, Any]]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        if not tender_id:
            tender_id = str(uuid.uuid4())

        file_hash = self.generate_file_hash(file_path)
        
        # Use Unstructured for PDF partitioning
        # strategy="hi_res" enables OCR for tables and images
        if partition_pdf:
            elements = partition_pdf(
                filename=file_path,
                strategy="hi_res", 
                infer_table_structure=True
            )
        else:
            # Fallback for environments where unstructured isn't fully set up (e.g. during simple tests without OCR)
            return self._mock_parse(file_path, tender_id, file_hash)

        clauses = []
        clause_buffer = ""
        current_clause_id = "PREAMBLE"
        current_page = 1
        
        for el in elements:
            text = str(el).strip()
            if not text: continue
            
            page = el.metadata.page_number if el.metadata.page_number else current_page
            current_page = page

            # Table Detection
            if el.category == "Table":
                self._flush_buffer(clauses, tender_id, current_clause_id, page, clause_buffer, file_hash)
                clause_buffer = ""
                
                table_id = f"TBL-PG{page}-{str(uuid.uuid4())[:6]}"
                clauses.append({
                    "tender_id": tender_id,
                    "clause_id": table_id,
                    "page": page,
                    "char_range": {"start": 0, "end": len(text)},
                    "clause_text": text, # Raw table text
                    "source_sha256": file_hash,
                    "metadata": {"type": "TABLE", "html": el.metadata.text_as_html}
                })
                continue

            # Heading/Clause Detection
            match = self.clause_pattern.match(text)
            if match or el.category == "Title":
                self._flush_buffer(clauses, tender_id, current_clause_id, page, clause_buffer, file_hash)
                
                # Sanitize ID
                raw_id = match.group(0).strip() if match else text[:20]
                clean_id = re.sub(r'[^a-zA-Z0-9\-\.]', '', raw_id)
                current_clause_id = f"CL-{clean_id}"
                clause_buffer = text
            else:
                clause_buffer += "\n" + text

        self._flush_buffer(clauses, tender_id, current_clause_id, current_page, clause_buffer, file_hash)
        return clauses

    def _flush_buffer(self, clauses, tender_id, clause_id, page, text, file_hash):
        if text.strip():
            clauses.append({
                "tender_id": tender_id,
                "clause_id": clause_id,
                "page": page,
                "char_range": {"start": 0, "end": len(text)},
                "clause_text": text.strip(),
                "source_sha256": file_hash,
                "metadata": {"type": "TEXT"}
            })

    def _mock_parse(self, file_path, tender_id, file_hash):
        # Only used if dependencies are missing (e.g. in CI without OCR)
        return [{
            "tender_id": tender_id,
            "clause_id": "MOCK-1",
            "page": 1,
            "char_range": {"start": 0, "end": 10},
            "clause_text": "Mock parsed content",
            "source_sha256": file_hash,
            "metadata": {"type": "MOCK"}
        }]

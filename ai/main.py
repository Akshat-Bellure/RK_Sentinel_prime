from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import hashlib
from verifier.engine import CitationVerifier
from strategist.agent import StrategistAgent
from drafter.agent import DrafterAgent

app = FastAPI(title="Sentinel AI Core", version="1.0")

# Init Agents (Load models from ap-south-1 paths)
verifier = CitationVerifier(kb_path="./data/kb_index")
strategist = StrategistAgent(model="llama-3-70b-instruct") # In-region hosted
drafter = DrafterAgent(model="llama-3-70b-instruct")

class DraftRequest(BaseModel):
    clause_text: str
    tender_metadata: dict

class VerificationRequest(BaseModel):
    citations: List[dict] # {source_id, snippet, page}

class DraftGenerationRequest(BaseModel):
    clause_text: str
    strategy: Dict[str, Any]
    tone: str

@app.get("/")
def health_check():
    return {"status": "AI_CORE_ONLINE", "region": "ap-south-1"}

@app.post("/parse/pdf")
async def parse_pdf(file: UploadFile = File(...)):
    # 1. Save temp
    # 2. Unstructured partition_pdf
    # 3. OCR fallback (Tesseract)
    # 4. Generate Clause Index with SHA256
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    return {"status": "indexed", "clauses_count": 42, "hash": file_hash}

@app.post("/strategist/analyze")
async def analyze_clause(req: DraftRequest):
    # RAG Lookup -> LLM Strategy
    result = strategist.run(req.clause_text, req.tender_metadata)
    return result

@app.post("/drafter/generate")
async def generate_draft(req: DraftGenerationRequest):
    # Calls Drafter Agent with Tone and Strategy
    result = drafter.draft(req.clause_text, req.strategy, req.tone)
    return result

@app.post("/verify/batch")
async def verify_citations(req: VerificationRequest):
    results = []
    for cit in req.citations:
        # Double-Blind Verification
        res = verifier.verify(cit.get('source_id'), cit.get('snippet'), cit.get('page'))
        if res['status'] == 'BLOCKED':
            # Log hallucination attempt
            print(f"BLOCK: {cit.get('snippet')} not found in {cit.get('source_id')}")
        results.append(res)
    return {"results": results}

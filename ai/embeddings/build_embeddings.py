import argparse
import json
import os
import sys
import time
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

def main():
    parser = argparse.ArgumentParser(description="Sentinel Prime Embedding Builder")
    parser.add_argument("--input", required=True, help="Path to clause index JSON (e.g., sample_data/tender_index_sample.json)")
    parser.add_argument("--collection", default="sentinel_clauses", help="Chroma collection name")
    parser.add_argument("--host", default="chromadb", help="Chroma DB host")
    parser.add_argument("--port", default="8000", help="Chroma DB port")
    parser.add_argument("--reset", action="store_true", help="Reset collection before indexing")
    args = parser.parse_args()

    # 1. Load Local Embedding Model
    print(f"[*] Loading local embedding model: all-MiniLM-L6-v2 (Region: ap-south-1 container)...")
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    except Exception as e:
        print(f"[!] Error loading model: {e}")
        sys.exit(1)

    # 2. Connect to Vector DB
    print(f"[*] Connecting to ChromaDB at {args.host}:{args.port}...")
    try:
        client = chromadb.HttpClient(host=args.host, port=args.port)
        print(f"[+] Connected to ChromaDB v{client.get_version()}")
    except Exception as e:
        print(f"[!] Could not connect to ChromaDB. Ensure the container is running. Error: {e}")
        sys.exit(1)
    
    # 3. Setup Collection
    if args.reset:
        try:
            client.delete_collection(args.collection)
            print(f"[-] Deleted existing collection: {args.collection}")
        except:
            pass

    collection = client.get_or_create_collection(name=args.collection)
    print(f"[*] Target Collection: {collection.name}")

    # 4. Load Input Data
    if not os.path.exists(args.input):
        print(f"[!] Input file not found: {args.input}")
        sys.exit(1)

    with open(args.input, 'r') as f:
        clauses = json.load(f)

    print(f"[*] Processing {len(clauses)} clauses from {args.input}...")

    ids = []
    documents = []
    metadatas = []
    embeddings = []

    start_time = time.time()

    for clause in clauses:
        # Composite ID: TenderID_ClauseID
        cid = f"{clause['tender_id']}_{clause['clause_id']}"
        text = clause['clause_text']
        
        # Metadata must be flat for Chroma
        meta = {
            "tender_id": clause['tender_id'],
            "clause_id": clause['clause_id'],
            "page": clause['page'],
            "source_sha256": clause.get('source_sha256', 'N/A'),
            "type": clause.get('metadata', {}).get('type', 'TEXT')
        }

        # Generate Embedding (384 dimensions for MiniLM)
        embedding = model.encode(text).tolist()

        ids.append(cid)
        documents.append(text)
        embeddings.append(embedding)
        metadatas.append(meta)

    # 5. Batch Upsert
    if ids:
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        duration = time.time() - start_time
        print(f"[+] Successfully indexed {len(ids)} clauses in {duration:.2f}s.")
        print(f"[+] Sample Vector (First 5 dims): {embeddings[0][:5]}...")
    else:
        print("[!] No clauses found to index.")

if __name__ == "__main__":
    main()

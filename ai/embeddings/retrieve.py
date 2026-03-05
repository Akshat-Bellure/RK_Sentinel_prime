import argparse
import chromadb
from sentence_transformers import SentenceTransformer

def main():
    parser = argparse.ArgumentParser(description="Sentinel Prime Vector Retrieval")
    parser.add_argument("--query", required=True, help="Query text to search")
    parser.add_argument("--n", default=3, type=int, help="Number of results to return")
    parser.add_argument("--host", default="chromadb", help="Chroma DB host")
    parser.add_argument("--port", default="8000", help="Chroma DB port")
    args = parser.parse_args()

    # Load same model for consistent query embedding
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    client = chromadb.HttpClient(host=args.host, port=args.port)
    collection = client.get_collection("sentinel_clauses")

    query_vec = model.encode(args.query).tolist()

    results = collection.query(
        query_embeddings=[query_vec],
        n_results=args.n
    )

    print(f"\n[*] Query: '{args.query}'")
    print(f"[*] Top {args.n} Results from ap-south-1 vector store:\n")

    if not results['documents']:
        print("No results found.")
        return

    for i, doc in enumerate(results['documents'][0]):
        meta = results['metadatas'][0][i]
        dist = results['distances'][0][i]
        print(f"--- Rank {i+1} (Distance: {dist:.4f}) ---")
        print(f"Ref: {meta['tender_id']} | Clause: {meta['clause_id']}")
        print(f"Text: {doc[:150]}...")
        print("")

if __name__ == "__main__":
    main()

import pandas as pd
from neo4j import GraphDatabase
import time

print("Initializing Neo4j Graph Population ")

# 1. Update these with your actual Neo4j Desktop credentials!
URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "password123")  # Replace 'password123' with your DB password

def clear_database(session):
    """Wipes the database clean so we don't accidentally double-load data."""
    print("Clearing existing graph data...")
    session.run("MATCH (n) DETACH DELETE n")

def upload_transactions(session, batch):
    """
    Uses UNWIND to bulk-insert thousands of rows at once.
    MERGE ensures we don't create duplicate user accounts.
    """
    cypher_query = """
    UNWIND $batch AS row
    
    // 1. Find or create the Sender
    MERGE (sender:User {user_id: row.sender_id})
    
    // 2. Find or create the Receiver
    MERGE (receiver:User {user_id: row.receiver_id})
    
    // 3. Draw the transaction line between them
    MERGE (sender)-[tx:SENT_MONEY {transaction_id: row.transaction_id}]->(receiver)
    SET tx.amount = toFloat(row.amount)
    """
    session.run(cypher_query, batch=batch)

def main():
    driver = GraphDatabase.driver(URI, auth=AUTH)
    
    # Load the exact dataset your model was trained on
    data_path = 'data/processed/final_model_data.csv'
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # We only need the structural columns to build the graph shape
    graph_df = df[['transaction_id', 'sender_id', 'receiver_id', 'amount']]
    records = graph_df.to_dict('records')
    total_records = len(records)
    
    with driver.session() as session:
        clear_database(session)
        
        print(f"Uploading {total_records} transactions to Neo4j in batches...")
        start_time = time.time()
        
        # We upload in batches of 10,000 to prevent crashing your computer's RAM
        batch_size = 10000
        for i in range(0, total_records, batch_size):
            batch = records[i : i + batch_size]
            upload_transactions(session, batch)
            print(f" -> Successfully mapped {min(i + batch_size, total_records)} / {total_records} edges...")
            
    driver.close()
    elapsed = round(time.time() - start_time, 2)
    print(f"✅ Graph population complete in {elapsed} seconds!")

if __name__ == "__main__":
    main()
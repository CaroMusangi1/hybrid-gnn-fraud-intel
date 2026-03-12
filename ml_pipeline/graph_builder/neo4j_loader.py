import pandas as pd
from neo4j import GraphDatabase
import time

# Connection details for your Neo4j Docker instance
URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "12345678") # Ensure this matches what you set in Docker

def load_data():
    print("Loading CSV files into memory...")
    users_df = pd.read_csv('data/raw/users.csv')
    agents_df = pd.read_csv('data/raw/agents.csv')
    devices_df = pd.read_csv('data/raw/devices.csv')
    institutions_df = pd.read_csv('data/raw/institutions.csv')
    tx_df = pd.read_csv('data/raw/transactions.csv')

    # Connect to Neo4j
    driver = GraphDatabase.driver(URI, auth=AUTH)
    
    with driver.session() as session:
        print("1. Loading Devices...")
        session.run("""
            UNWIND $rows AS row
            MERGE (d:Device {device_id: row.device_id})
            SET d.is_rooted = row.is_rooted
        """, parameters={'rows': devices_df.to_dict('records')})

        print("2. Loading Institutions...")
        session.run("""
            UNWIND $rows AS row
            MERGE (i:Institution {institution_id: row.institution_id})
            SET i.name = row.name
        """, parameters={'rows': institutions_df.to_dict('records')})

        print("3. Loading Users and linking to Devices...")
        session.run("""
            UNWIND $rows AS row
            MERGE (u:User {user_id: row.user_id})
            SET u.account_age_days = row.account_age_days,
                u.kyc_level = row.kyc_level,
                u.has_defaulted = row.has_defaulted
            WITH u, row
            MATCH (d:Device {device_id: row.device_id})
            MERGE (u)-[:USES]->(d)
        """, parameters={'rows': users_df.to_dict('records')})

        print("4. Loading Agents...")
        session.run("""
            UNWIND $rows AS row
            MERGE (a:Agent {agent_id: row.agent_id})
            SET a.agent_type = row.agent_type,
                a.location = row.location
        """, parameters={'rows': agents_df.to_dict('records')})

        print("5. Loading Transactions (Edges)... This might take a minute.")
        # P2P Transfers
        p2p = tx_df[tx_df['tx_type'] == 'P2P_TRANSFER']
        session.run("""
            UNWIND $rows AS row
            MATCH (s:User {user_id: row.sender_id})
            MATCH (r:User {user_id: row.receiver_id})
            MERGE (s)-[t:P2P_TRANSFER {transaction_id: row.transaction_id}]->(r)
            SET t.amount = row.amount, 
                t.timestamp = datetime(replace(row.timestamp, ' ', 'T')), 
                t.is_fraud = row.is_fraud, 
                t.fraud_scenario = row.fraud_scenario
        """, parameters={'rows': p2p.to_dict('records')})

        # Withdrawals
        withdrawals = tx_df[tx_df['tx_type'] == 'WITHDRAWAL']
        session.run("""
            UNWIND $rows AS row
            MATCH (s:User {user_id: row.sender_id})
            MATCH (a:Agent {agent_id: row.receiver_id})
            MERGE (s)-[t:WITHDRAWAL {transaction_id: row.transaction_id}]->(a)
            SET t.amount = row.amount, t.timestamp = datetime(replace(row.timestamp, ' ', 'T')), t.is_fraud = row.is_fraud
        """, parameters={'rows': withdrawals.to_dict('records')})

        # Payments
        payments = tx_df[tx_df['tx_type'] == 'PAYMENT']
        session.run("""
            UNWIND $rows AS row
            MATCH (s:User {user_id: row.sender_id})
            MATCH (a:Agent {agent_id: row.receiver_id})
            MERGE (s)-[t:PAYMENT {transaction_id: row.transaction_id}]->(a)
            SET t.amount = row.amount, t.timestamp = datetime(replace(row.timestamp, ' ', 'T')), t.is_fraud = row.is_fraud
        """, parameters={'rows': payments.to_dict('records')})

        # Loan Disbursements
        loans = tx_df[tx_df['tx_type'] == 'LOAN_DISBURSEMENT']
        session.run("""
            UNWIND $rows AS row
            MATCH (i:Institution {institution_id: row.sender_id})
            MATCH (u:User {user_id: row.receiver_id})
            MERGE (i)-[t:LOAN_DISBURSEMENT {transaction_id: row.transaction_id}]->(u)
            SET t.amount = row.amount, t.timestamp = datetime(replace(row.timestamp, ' ', 'T')), t.is_fraud = row.is_fraud
        """, parameters={'rows': loans.to_dict('records')})

        # Reversal Requests
        reversals = tx_df[tx_df['tx_type'] == 'REVERSAL_REQUEST']
        session.run("""
            UNWIND $rows AS row
            MATCH (s:User {user_id: row.sender_id})
            MATCH (r:User {user_id: row.receiver_id})
            MERGE (s)-[t:REVERSAL_REQUEST {transaction_id: row.transaction_id}]->(r)
            SET t.amount = row.amount, t.timestamp = datetime(replace(row.timestamp, ' ', 'T')), t.is_fraud = row.is_fraud
        """, parameters={'rows': reversals.to_dict('records')})

    driver.close()
    print("Graph construction complete! Your Neo4j database is fully populated.")

if __name__ == "__main__":
    start_time = time.time()
    load_data()
    print(f"Execution time: {round(time.time() - start_time, 2)} seconds")
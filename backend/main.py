from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import GraphDatabase
import pandas as pd
import xgboost as xgb
import pickle
import os

# 1. INITIALIZE APP & CONNECTIONS 
app = FastAPI(title="M-Pesa Fraud Intelligence API", version="1.0")

# CORS MIDDLEWARE BLOCK 
# This allows your React frontend (port 5173) to talk to FastAPI (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Neo4j Connection (Update with your local credentials)
URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "12345678")
driver = GraphDatabase.driver(URI, auth=AUTH)

# Load the trained Hybrid Meta-Learner (Tier 1)
# Dynamically find the absolute path to your main project folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "saved", "hybrid_xgboost.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        hybrid_model = pickle.load(f)
    print(f"✅ SUCCESS: AI Brain loaded from {MODEL_PATH}")
except FileNotFoundError:
    print(f"Warning: Model file not found at {MODEL_PATH}. API will fail on prediction.")


# 2. DEFINE DATA SCHEMAS (Pydantic) 
class TransactionRequest(BaseModel):
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    transactions_last_24hr: int
    hour: int

class PredictionResponse(BaseModel):
    transaction_id: str
    risk_score: float
    decision: str 
    reason: str

# 3. THE AI ANALYST BUSINESS LOGIC (Tier 2) 
def apply_ai_analyst(amount: float, velocity: int, risk_score: float) -> tuple[str, str]:
    """Applies the Kenyan M-Pesa rules to the Hybrid model's risk score."""
    if risk_score >= 0.85:
        return "AUTO_FREEZE", "High confidence of severe fraud topology."
    
    # The queue rules (0.25 to 0.84)
    if risk_score > 0.50 and amount < 300 and velocity > 5:
        return "CONFIRMED_FRAUD", "Micro-scam velocity detected (Kamiti rule)."
    elif risk_score < 0.50 and 100 <= amount <= 3000 and velocity < 4:
        return "AUTO_CLEARED_SAFE", "Normal retail behavior (Kiosk rule)."
    elif amount > 100000:
        return "REQUIRE_HUMAN", "High-value compliance limit exceeded (Wash-Wash rule)."
    else:
        return "REQUIRE_HUMAN", "Ambiguous pattern. Manual review required."

# 4. API ENDPOINTS 

@app.post("/predict", response_model=PredictionResponse)
async def predict_fraud(tx: TransactionRequest):
    """
    The Core Engine: 
    1. Receives tabular data. 
    2. Queries Neo4j for network context and updates the graph. 
    3. Runs Hybrid Model. 
    4. Applies AI Analyst rules.
    """
    # 1. LIVE GRAPH UPDATE: Add the new transaction, then count the connections
    cypher_query = """
    // Ensure both users exist in the graph
    MERGE (s:User {user_id: $sender_id})
    MERGE (r:User {user_id: $receiver_id})
    
    // Draw the new transaction line (The Graph Update)
    MERGE (s)-[tx:SENT_MONEY {transaction_id: $tx_id}]->(r)
    SET tx.amount = toFloat($amount)
    
    // Calculate the updated network topology for the model
    WITH s
    MATCH (s)-[:SENT_MONEY]->(u:User)
    RETURN count(DISTINCT u) AS num_unique_recipients
    """
    
    try:
        with driver.session() as session:
            result = session.run(
                cypher_query, 
                sender_id=tx.sender_id,
                receiver_id=tx.receiver_id,
                tx_id=tx.transaction_id,
                amount=tx.amount
            )
            record = result.single()
            num_unique_recipients = record["num_unique_recipients"] if record else 0
            
            mock_gnn_score = 0.45 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neo4j Database Error: {str(e)}")

    # 2. Build the exact feature row our XGBoost model expects
    # XGBoost demands these exact 16 columns in this specific order.
    # We use live data where possible, simple logic for flags, and mock the deep graph metrics.
    features = pd.DataFrame([{
        "amount": tx.amount,
        "num_accounts_linked": 1,                      # Mock: Normal user usually has 1 account
        "shared_device_flag": 0,                       # Mock: 0 = No, 1 = Yes
        "avg_transaction_amount": 1500.0,              # Mock: Average historical amount
        "transaction_frequency": 2,                    # Mock: Weekly frequency
        "num_unique_recipients": num_unique_recipients,# LIVE: From Neo4j
        "transactions_last_24hr": tx.transactions_last_24hr, # LIVE: From React
        "round_amount_flag": 1 if tx.amount % 100 == 0 else 0, # Logic: 1 if amount is exactly 500, 1000, etc.
        "hour": tx.hour,                               # LIVE: From React
        "night_activity_flag": 1 if tx.hour < 5 else 0,# Logic: 1 if before 5 AM
        "triad_closure_score": 0.1,                    # Mock: Graph metric
        "pagerank_score": 0.005,                       # Mock: Graph metric
        "in_degree": 2,                                # Mock: Graph metric
        "out_degree": num_unique_recipients,           # Logic: Matches unique recipients
        "cycle_indicator": 0,                          # Mock: Graph metric (1 = likely wash-wash cycle)
        "gnn_fraud_risk_score": mock_gnn_score         # Mock: 0.45 from earlier in the script
    }])

    # 3. Model Inference
    try:
        # Let's try to run the real math!
        risk_score = hybrid_model.predict_proba(features)[0][1]
        print(f"✅ XGBoost Calculation Success! Real Risk Score: {risk_score}")
    except Exception as e:
         # If it fails, we print the EXACT error to the terminal so we can fix it
         print(f"❌ XGBoost Feature Mismatch Error: {str(e)}") 
         risk_score = 0.65 # Fallback

    # 4. Tier 2 AI Analyst Decision
    decision, reason = apply_ai_analyst(tx.amount, tx.transactions_last_24hr, risk_score)

    return PredictionResponse(
        transaction_id=tx.transaction_id,
        risk_score=round(risk_score, 4),
        decision=decision,
        reason=reason
    )

@app.get("/alert")
async def get_alerts():
    """Endpoint for the front-end dashboard to fetch the Review Queue."""
    return {
        "status": "success",
        "active_alerts": 142,
        "message": "Fetch from the database queue here."
    }
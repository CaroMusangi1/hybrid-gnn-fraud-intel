from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to Python path so we can import backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# This creates a dummy browser to hit your API locally
client = TestClient(app)

print(" Running Week 6 Integration Tests ")

def test_predict_endpoint_success():
    """
    Test: API request → model inference → response
    Simulates a normal 500 Ksh transaction.
    """
    payload = {
        "transaction_id": "TXN999888",
        "sender_id": "USER_123",
        "receiver_id": "USER_456",
        "amount": 500.0,
        "transactions_last_24hr": 1,
        "hour": 14
    }
    
    # Send the POST request
    response = client.post("/predict", json=payload)
    
    # The Assertions (The Proof)
    assert response.status_code == 200, "API crashed or refused connection!"
    
    data = response.json()
    assert "risk_score" in data, "Response is missing the risk score!"
    assert "decision" in data, "Response is missing the AI Analyst decision!"
    
    print(f"✅ Predict Integration Passed. API returned decision: {data['decision']}")

def test_alert_endpoint():
    """Test: Make sure the alert dashboard endpoint is alive."""
    response = client.get("/alert")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    print("✅ Alert Integration Passed.")

if __name__ == "__main__":
    test_predict_endpoint_success()
    test_alert_endpoint()
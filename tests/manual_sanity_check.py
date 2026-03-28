import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

print(" MANUAL PIPELINE INSPECTION ")

# ---------------------------------------------------------
# 1. MANUAL CHECK: EMBEDDING FUSION
# ---------------------------------------------------------
print("\n[CHECK 1] Testing Data Fusion...")
df = pd.read_csv('data/processed/final_model_data.csv')
probs_df = pd.read_csv('data/processed/gnn_probabilities.csv')

print(f"-> Tabular Data Rows: {len(df)}")
print(f"-> GNN Output Rows:   {len(probs_df)}")

# If these don't match, the script should yell at us
if len(df) != len(probs_df):
    print("❌ ERROR: Row counts do not match! Fusion will corrupt the data.")
else:
    print("✅ SUCCESS: Row counts match perfectly.")

hybrid_df = pd.concat([df, probs_df], axis=1)

print("\n-> Sneak Peek at the Fused Data (Amount vs GNN Score):")
# We print the first 5 rows to visually prove they are sitting next to each other
print(hybrid_df[['amount', 'gnn_fraud_risk_score', 'is_fraud']].head(5))


# ---------------------------------------------------------
# 2. MANUAL CHECK: CLASSIFIER & PROBABILITY RANGE
# ---------------------------------------------------------
print("\n[CHECK 2 & 3] Testing Classifier and Output Bounds...")
drop_cols = ['sender_id', 'receiver_id', 'timestamp', 'device_id', 'agent_id', 
             'is_fraud', 'fraud_scenario']
X = hybrid_df.drop(columns=drop_cols, errors='ignore')
y = hybrid_df['is_fraud']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train a very fast, lightweight model just for the manual check
model = XGBClassifier(n_estimators=10, max_depth=3, random_state=42, eval_metric='logloss')
model.fit(X_train, y_train)

# Generate probabilities for the test set
probs = model.predict_proba(X_test)[:, 1]

min_prob = min(probs)
max_prob = max(probs)

print(f"-> Lowest Probability Generated:  {min_prob:.4f} (Must be >= 0.0)")
print(f"-> Highest Probability Generated: {max_prob:.4f} (Must be <= 1.0)")

if min_prob >= 0.0 and max_prob <= 1.0:
    print("✅ SUCCESS: All mathematical bounds are respected.")
else:
    print("❌ ERROR: Probabilities are out of bounds!")

# ---------------------------------------------------------
# 3. MANUAL CHECK: REAL PREDICTIONS
# ---------------------------------------------------------
print("\n[BONUS] Let's look at 5 random predictions from the test set:")
sample_indices = [0, 10, 50, 100, 500]
for i in sample_indices:
    actual_status = "Fraud" if y_test.iloc[i] == 1 else "Safe "
    print(f"   Transaction {i:<4} | Actual: {actual_status} | Model Predicts: {probs[i]*100:>5.1f}% Fraud Risk")
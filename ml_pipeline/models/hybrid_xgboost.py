import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

print(" Group 15: HYBRID GNN-XGBoost Evaluation ")

# 1. Load the fully enriched data (Tabular + NetworkX Graph features)
print("Loading Tabular and NetworkX Graph features...")
df = pd.read_csv('data/processed/final_model_data.csv')

# 2. Load the GNN Embeddings (The 64-D Structural Brain from Week 4)
print("Loading GNN Structural Embeddings...")
embeddings_df = pd.read_csv('data/processed/user_embeddings.csv')

# 3. FUSION: Merge everything together
print("Fusing Data Layers...")
# We add a prefix to the GNN columns so they don't clash with your tabular column names
embeddings_df = embeddings_df.add_prefix('gnn_')

# Merge the sender's graph intelligence onto the transaction.
# Since we prefixed the columns, 'user_id' became 'gnn_user_id'
hybrid_df = df.merge(
    embeddings_df,
    left_on='sender_id',
    right_on='gnn_user_id',
    how='left'
)

# 4. Prepare for Machine Learning
# Drop IDs and metadata so the model only sees pure math and features
drop_cols = ['sender_id', 'receiver_id', 'timestamp', 'device_id', 'agent_id', 
             'is_fraud', 'fraud_scenario', 'gnn_user_id']
X = hybrid_df.drop(columns=drop_cols, errors='ignore')
y = hybrid_df['is_fraud']
scenarios = hybrid_df['fraud_scenario']

# 5. Split Data (Aligning with the EXACT same seed as the baseline for a fair fight)
X_train, X_test, y_train, y_test, scen_train, scen_test = train_test_split(
    X, y, scenarios, test_size=0.2, random_state=42, stratify=y
)

# 6. Train the Ultimate Hybrid Model
print(f"Training HYBRID XGBoost on {len(X_train)} transactions...")
# Handle the 2.8% class imbalance automatically
pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)
hybrid_model = XGBClassifier(
    n_estimators=100, 
    max_depth=6, 
    learning_rate=0.1, 
    scale_pos_weight=pos_weight, 
    random_state=42,
    eval_metric='logloss'
)
hybrid_model.fit(X_train, y_train)

# 7. Segmented Evaluation (The Proof for my Thesis)
print("\n HYBRID Model Detection Analysis ")
predictions = hybrid_model.predict(X_test)
probabilities = hybrid_model.predict_proba(X_test)[:, 1]

results = pd.DataFrame({
    'Actual': y_test,
    'Predicted': predictions,
    'Scenario': scen_test
})

actual_fraud = results[results['Actual'] == 1]

print(f"{'Fraud Topology':<20} | {'Caught (True Pos)'} | {'Missed (False Neg)'} | {'Recall (Detection Rate)'}")
print("-" * 75)

for scenario in actual_fraud['Scenario'].unique():
    scenario_data = actual_fraud[actual_fraud['Scenario'] == scenario]
    total_cases = len(scenario_data)
    caught = sum(scenario_data['Predicted'] == 1)
    missed = total_cases - caught
    recall = (caught / total_cases) * 100 if total_cases > 0 else 0.0
    
    print(f"{scenario:<20} | {caught:<17} | {missed:<18} | {recall:.1f}%")

print("\n Overall Performance ...")
print(classification_report(y_test, predictions, target_names=['Safe (0)', 'Fraud (1)']))
print(f"HYBRID ROC-AUC Score: {roc_auc_score(y_test, probabilities):.4f}")
print("\nGroup 15 Conclusion: Compare this table to your Baseline XGBoost. The Graph Intelligence is active!")
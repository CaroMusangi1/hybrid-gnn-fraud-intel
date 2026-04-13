import pickle
import os
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

print("Group 15:(TIER ONE) STACKED HYBRID GNN-XGBoost Evaluation ")

# 1. Load the Data
print("Loading Tabular features...")
df = pd.read_csv('data/processed/final_model_data.csv')

print("Loading GNN Embeddings (The Stacked Feature)...")
embeddings_df = pd.read_csv('data/processed/user_embeddings.csv')

# AUTO-DETECT EMBEDDINGS DIMENSIONS
# Instead of hardcoding 64, we detect the number of embedding columns dynamically
embedding_dim = len(embeddings_df.columns) - 1  # Subtract 1 for the 'user_id' column
print(f"Auto-detected embedding dimensions: {embedding_dim}")

# Create sender and receiver embedding feature blocks to inject richer topology context
sender_embeddings = embeddings_df.add_prefix('gnn_sender_')
receiver_embeddings = embeddings_df.add_prefix('gnn_receiver_')

hybrid_df = df.merge(
    sender_embeddings,
    left_on='sender_id',
    right_on='gnn_sender_user_id',
    how='left'
)

hybrid_df = hybrid_df.merge(
    receiver_embeddings,
    left_on='receiver_id',
    right_on='gnn_receiver_user_id',
    how='left'
)

# Non-user receivers may not have embeddings; default missing embedding values to zero.
embedding_cols = [c for c in hybrid_df.columns if c.startswith('gnn_sender_') or c.startswith('gnn_receiver_')]
hybrid_df[embedding_cols] = hybrid_df[embedding_cols].fillna(0)

# TOPOLOGY INTERACTION FEATURES
# These capture the *relationship* between sender and receiver in graph space,
# which is the exact signal that exposes fraud rings and mule chains.
print("Computing sender-receiver topology interaction features...")
sender_cols = [c for c in hybrid_df.columns if c.startswith('gnn_sender_') and c != 'gnn_sender_user_id']
receiver_cols = [c for c in hybrid_df.columns if c.startswith('gnn_receiver_') and c != 'gnn_receiver_user_id']

sender_mat = hybrid_df[sender_cols].values
receiver_mat = hybrid_df[receiver_cols].values

# Compute all interaction features at once and concat to avoid fragmentation warnings
sender_norms = np.linalg.norm(sender_mat, axis=1, keepdims=True)
receiver_norms = np.linalg.norm(receiver_mat, axis=1, keepdims=True)
cosine_denom = np.maximum(sender_norms * receiver_norms, 1e-8)
topo_features = pd.DataFrame({
    'topo_dot_product': np.sum(sender_mat * receiver_mat, axis=1),
    'topo_l2_distance': np.linalg.norm(sender_mat - receiver_mat, axis=1),
    'topo_l1_distance': np.sum(np.abs(sender_mat - receiver_mat), axis=1),
    'topo_cosine_sim':  np.sum(sender_mat * receiver_mat, axis=1) / cosine_denom.squeeze(),
}, index=hybrid_df.index)
hybrid_df = pd.concat([hybrid_df, topo_features], axis=1)
print(f"Added 4 topology interaction features (dot, l2, l1, cosine)")

print(f"Stacked feature set dimensions: {embedding_dim} embedding features")

# 3. Prepare for Machine Learning
drop_cols = ['sender_id', 'receiver_id', 'timestamp', 'device_id', 'agent_id', 
             'is_fraud', 'fraud_scenario', 'gnn_sender_user_id', 'gnn_receiver_user_id']
X = hybrid_df.drop(columns=drop_cols, errors='ignore')
y = hybrid_df['is_fraud']
scenarios = hybrid_df['fraud_scenario']

print(f"Feature set shape: {X.shape}")
print(f"Includes {embedding_dim} auto-detected GNN embedding dimensions")

# 4. Split Data (Strict 42 Seed)
X_train, X_test, y_train, y_test, scen_train, scen_test = train_test_split(
    X, y, scenarios, test_size=0.2, random_state=42, stratify=y
)

# 5. Train the TUNED Stacked XGBoost
print(f"Training TUNED STACKED XGBoost on {len(X_train)} transactions...")
pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)

stacked_model = XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.02,
    colsample_bytree=0.75,
    subsample=0.85,
    min_child_weight=3,
    gamma=0.3,
    reg_alpha=0.1,
    reg_lambda=6.0,
    tree_method='hist',
    scale_pos_weight=pos_weight * 1.2,
    random_state=42,
    eval_metric='auc'
)

# SCENARIO-AWARE SAMPLE WEIGHTS
# We tell the model to pay extra attention to topologically hard fraud patterns.
# These are the exact scenarios that define our thesis contribution.
scenario_weight_map = {
    'fraud_ring':     4.0,  # Highest priority: GNN structural blind-spot pattern
    'mule_sim_swap':  3.0,  # High priority: network-chained identity fraud
    'fast_cashout':   1.5,  # Moderate: partially visible without graph
    'business_fraud': 1.5,  # Moderate: already detects well
    'loan_fraud':     1.5,  # Moderate: already detects well
    'Normal':         1.0,  # Baseline safe transactions
}
sample_weights = np.array([
    scenario_weight_map.get(s, 1.0) for s in scen_train
])
print("Scenario-aware sample weights applied:")
for scenario, weight in scenario_weight_map.items():
    count = (scen_train == scenario).sum()
    print(f"  {scenario:<20} x{weight} ({count} training samples)")

stacked_model.fit(X_train, y_train, sample_weight=sample_weights)

# Save the trained model for the API to use
os.makedirs('models/saved', exist_ok=True)
with open('models/saved/hybrid_xgboost.pkl', 'wb') as f:
    pickle.dump(stacked_model, f)
print("\n-> Brain Exported: Saved trained model to 'models/saved/hybrid_xgboost.pkl'")

# 6. Evaluation: PURE ML PERFORMANCE (Threshold = 0.50)
print("\n STACKED Model Detection Analysis ")
predictions = stacked_model.predict(X_test)
probabilities = stacked_model.predict_proba(X_test)[:, 1]

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

print("\nOverall Performance:")
print(classification_report(y_test, predictions, target_names=['Safe (0)', 'Fraud (1)']))
print(f"STACKED ROC-AUC Score: {roc_auc_score(y_test, probabilities):.4f}")

# 7. Evaluation: THE TRAFFIC LIGHT SYSTEM (Human-in-the-Loop)
print("\nSTACKED Model: Business Logic")
business_decisions = []
for prob in probabilities:
    if prob >= 0.85:
        business_decisions.append('AUTO_FREEZE')
    elif prob >= 0.25:
        business_decisions.append('MANUAL_REVIEW')
    else:
        business_decisions.append('SAFE')

results_biz = pd.DataFrame({
    'Actual': y_test,
    'Probability': probabilities,
    'Decision': business_decisions
})

actual_fraud_biz = results_biz[results_biz['Actual'] == 1]
total_fraud = len(actual_fraud_biz)

auto_caught = len(actual_fraud_biz[actual_fraud_biz['Decision'] == 'AUTO_FREEZE'])
analyst_caught = len(actual_fraud_biz[actual_fraud_biz['Decision'] == 'MANUAL_REVIEW'])
missed_fraud = len(actual_fraud_biz[actual_fraud_biz['Decision'] == 'SAFE'])

print(f"Total Actual Fraud Cases in Test Set: {total_fraud}")
print("-" * 65)
print(f" AUTO-FREEZE (High Precision): {auto_caught} cases caught instantly.")
print(f" ANALYST QUEUE (High Recall) : {analyst_caught} cases sent to human review.")
print(f" MISSED (False Negatives)    : {missed_fraud} cases escaped.")
print("-" * 65)

system_recall = ((auto_caught + analyst_caught) / total_fraud) * 100
print(f"Total SYSTEM Recall (Model + Analyst): {system_recall:.1f}%")

safe_in_review = len(results_biz[(results_biz['Actual'] == 0) & (results_biz['Decision'] == 'MANUAL_REVIEW')])
print(f"\nAnalyst Workload: There are {safe_in_review} innocent transactions mixed into the Review Queue.")
print("The human analyst acts as the ultimate filter to protect Precision")

# 8. HANDOFF TO TIER 2 (Export the Review Queue)
# We isolate only the transactions that the model was unsure about
review_indices = results_biz[results_biz['Decision'] == 'MANUAL_REVIEW'].index
review_queue = X_test.loc[review_indices].copy()
review_queue['Probability'] = results_biz.loc[review_indices, 'Probability']
review_queue['Actual'] = results_biz.loc[review_indices, 'Actual']
review_queue['fraud_scenario'] = scen_test.loc[review_indices]

# Save it for the AI Analyst Agent
review_queue.to_csv('data/processed/review_queue.csv', index=False)
print("\n Pipeline Handoff: Saved Review Queue to 'review_queue.csv' for the AI Analyst.")
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

print("Group 15: STACKED HYBRID GNN-XGBoost Evaluation ")

# 1. Load the Data
print("Loading Tabular features...")
df = pd.read_csv('data/processed/final_model_data.csv')

print("Loading GNN Probabilities (The Stacked Feature)...")
probs_df = pd.read_csv('data/processed/gnn_probabilities.csv')

# 2. STACKING
hybrid_df = pd.concat([df, probs_df], axis=1)

# 3. Prepare for Machine Learning
drop_cols = ['sender_id', 'receiver_id', 'timestamp', 'device_id', 'agent_id', 
             'is_fraud', 'fraud_scenario']
X = hybrid_df.drop(columns=drop_cols, errors='ignore')
y = hybrid_df['is_fraud']
scenarios = hybrid_df['fraud_scenario']

# 4. Split Data (Strict 42 Seed)
X_train, X_test, y_train, y_test, scen_train, scen_test = train_test_split(
    X, y, scenarios, test_size=0.2, random_state=42, stratify=y
)

# 5. Train the TUNED Stacked XGBoost
print(f"Training TUNED STACKED XGBoost on {len(X_train)} transactions...")
pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)

stacked_model = XGBClassifier(
    n_estimators=150,           
    max_depth=4,                
    learning_rate=0.05,         
    colsample_bytree=0.6,       
    scale_pos_weight=pos_weight * 1.5, 
    random_state=42,
    eval_metric='logloss'
)
stacked_model.fit(X_train, y_train)

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
print("\n-> Pipeline Handoff: Saved Review Queue to 'review_queue.csv' for the AI Analyst.")
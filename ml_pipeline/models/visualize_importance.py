import pandas as pd
import matplotlib.pyplot as plt
from xgboost import XGBClassifier
import xgboost as xgb
from sklearn.model_selection import train_test_split

print(" Generating Visuals: Feature Importance ")

# 1. Load the fused data (THIS IS WHAT MAKES IT HYBRID)
print("Merging Tabular Data with GNN Graph Intelligence...")
df = pd.read_csv('data/processed/final_model_data.csv')
probs_df = pd.read_csv('data/processed/gnn_probabilities.csv')

# The Hybrid Concat: 9 Tabular Features + 1 GNN Feature
hybrid_df = pd.concat([df, probs_df], axis=1)

drop_cols = ['sender_id', 'receiver_id', 'timestamp', 'device_id', 'agent_id', 
             'is_fraud', 'fraud_scenario']
X = hybrid_df.drop(columns=drop_cols, errors='ignore')
y = hybrid_df['is_fraud']

# 2. Split Data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 3. Train the Tuned Hybrid Meta-Learner
print("Training the Hybrid Meta-Learner to calculate feature weights...")
pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)
model = XGBClassifier(
    n_estimators=150, max_depth=4, learning_rate=0.05, 
    colsample_bytree=0.6, scale_pos_weight=pos_weight * 1.5, 
    random_state=42, eval_metric='logloss'
)
model.fit(X_train, y_train)

# 4. Generate the Plot
print("Plotting Graph...")
plt.figure(figsize=(10, 6))

# We use 'weight' which shows how many times a feature was used to split a decision tree
xgb.plot_importance(
    model, 
    importance_type='weight', 
    max_num_features=10, 
    title='Hybrid Meta-Learner: Top 10 Most Important Features',
    xlabel='F-Score (Number of times used to make a decision)',
    ylabel='Features',
    color='#1f77b4'
)

# 5. Save and Show
plt.tight_layout()
plt.savefig('data/processed/feature_importance.png', dpi=300) 
print("-> SUCCESS! Image saved to 'data/processed/feature_importance.png'")
plt.show()
import pandas as pd
import torch
from torch_geometric.data import HeteroData
from sklearn.preprocessing import StandardScaler
import os

print(" Phase 1.9: PyTorch Tensor Conversion ")

# 1. Load the Ultimate Dataset
print("Loading 22-feature defense-ready dataset...")
df = pd.read_csv('data/processed/final_model_data.csv')

# 2. Extract Unique Users and their Node Features
print("Extracting Node Features...")
# These are the amazing features you just engineered!
user_features_cols = [
    'num_accounts_linked', 'shared_device_flag', 'avg_transaction_amount',
    'transaction_frequency', 'num_unique_recipients', 'transactions_last_24hr',
    'round_amount_flag', 'night_activity_flag', 'triad_closure_score',
    'pagerank_score', 'in_degree', 'out_degree', 'cycle_indicator'
]

# Drop duplicates so we have one unique mathematical profile per sender
user_nodes = df[['sender_id'] + user_features_cols].drop_duplicates(subset=['sender_id'])

# We need to map string IDs (e.g., "U_145") to PyTorch integer IDs (e.g., 145)
all_users = pd.concat([df['sender_id'], df['receiver_id']]).unique()
user_mapping = {user_id: i for i, user_id in enumerate(all_users)}

df['sender_idx'] = df['sender_id'].map(user_mapping)
df['receiver_idx'] = df['receiver_id'].map(user_mapping)

# 3. Build the PyTorch Heterogeneous Data Object
print("Building HeteroData Object...")
data = HeteroData()

# Merge features for all users (fill with 0 if they only received money and never sent)
user_features_full = pd.DataFrame({'user_id': all_users})
user_features_full = user_features_full.merge(
    user_nodes, left_on='user_id', right_on='sender_id', how='left'
).fillna(0)

# 4. Neural Networks hate large numbers. We must scale them (Z-Score Normalization)
scaler = StandardScaler()
x_scaled = scaler.fit_transform(user_features_full[user_features_cols])
data['user'].x = torch.tensor(x_scaled, dtype=torch.float)

# 5. Add the Edges (The Network Graph)
edge_index = torch.tensor([df['sender_idx'].values, df['receiver_idx'].values], dtype=torch.long)
data['user', 'p2p', 'user'].edge_index = edge_index

# Add the labels (1 = Fraud, 0 = Safe)
data['user', 'p2p', 'user'].y = torch.tensor(df['is_fraud'].values, dtype=torch.long)

# 6. Save the Graph!
os.makedirs('data/processed', exist_ok=True)
torch.save(data, 'data/processed/hetero_graph.pt')

print(f"\nSuccess! Graph converted to PyTorch Tensors.")
print(f"Nodes: {data['user'].num_nodes} Users")
print(f"Edges: {data['user', 'p2p', 'user'].num_edges} Transactions")
print("Saved to: data/processed/hetero_graph.pt")
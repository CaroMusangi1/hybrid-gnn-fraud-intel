import torch
import pandas as pd
from torch_geometric.nn import SAGEConv, to_hetero

print(": Week 4 Manual Inspection ")

# 1. Load the Graph Data
data = torch.load('data/processed/hetero_graph.pt', weights_only=False)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
data = data.to(device)

# 2. Rebuild the Architecture Structure
class GNNEncoder(torch.nn.Module):
    def __init__(self, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv((-1, -1), hidden_channels)
        self.conv2 = SAGEConv((-1, -1), out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index)
        return x

class EdgeClassifier(torch.nn.Module):
    def __init__(self, hidden_channels):
        super().__init__()
        self.lin1 = torch.nn.Linear(2 * hidden_channels, hidden_channels)
        self.lin2 = torch.nn.Linear(hidden_channels, 1)

    def forward(self, z_dict, edge_index, sender_type, receiver_type):
        row, col = edge_index
        z = torch.cat([z_dict[sender_type][row], z_dict[receiver_type][col]], dim=-1)
        z = self.lin1(z).relu()
        z = self.lin2(z)
        return z.view(-1)

class HybridGNN(torch.nn.Module):
    def __init__(self, hidden_channels):
        super().__init__()
        self.encoder = GNNEncoder(hidden_channels, hidden_channels)
        self.encoder = to_hetero(self.encoder, data.metadata(), aggr='mean')
        self.classifier = EdgeClassifier(hidden_channels)

    def forward(self, x_dict, edge_index_dict, target_edge_index, sender_type, receiver_type):
        z_dict = self.encoder(x_dict, edge_index_dict)
        return self.classifier(z_dict, target_edge_index, sender_type, receiver_type)

# Initialize a fresh model just to test the pipes
model = HybridGNN(hidden_channels=64).to(device)
model.eval()

#  RUBRIC 1: TEST FORWARD PASS 
print("\n[Rubric 1] Testing Forward Pass...")
with torch.no_grad():
    # Push the data through the encoder to see if it crashes
    z_dict = model.encoder(data.x_dict, data.edge_index_dict)
print("-> SUCCESS! Forward Pass completed without crashing.")
print(f"-> Internal Tensor Shape: {z_dict['user'].shape}")
# Let's peek at the actual math for User 0 (just the first 3 numbers)
print(f"-> Math X-Ray (User 0, first 3 dims): {z_dict['user'][0][:3].tolist()}")

#  RUBRIC 2: TEST EMBEDDING DIMENSIONS 
print("\n[Rubric 2] Testing Embedding Dimensions...")
try:
    df = pd.read_csv('data/processed/user_embeddings.csv')
    print("-> SUCCESS! user_embeddings.csv loaded.")
    print(f"-> Rows (Users): {df.shape[0]} (Expected: 10000)")
    print(f"-> Columns (ID + 64 Dims): {df.shape[1]} (Expected: 65)")
except FileNotFoundError:
    print("-> ERROR: user_embeddings.csv not found!")

# RUBRIC 3 & 4: TEST INFERENCE ON SMALL DATASET 
print("\n[Rubric 3 & 4] Testing Inference on Small Dataset (First 5 Transactions)...")
# Grab just the first 5 P2P transaction edges
sample_edges = data['user', 'p2p', 'user'].edge_index[:, :5]

with torch.no_grad():
    # Pass them through the full model
    raw_logits = model(data.x_dict, data.edge_index_dict, sample_edges, 'user', 'user')
    # Convert raw math (logits) into a 0-100% human probability
    probabilities = torch.sigmoid(raw_logits)

for i in range(5):
    print(f"-> Transaction {i+1}: Logit ({raw_logits[i]:.4f}) translates to {probabilities[i]*100:.2f}% Fraud Risk")

print("\nManual Inspection Complete! If the numbers above look healthy, your architecture is mathematically sound.")
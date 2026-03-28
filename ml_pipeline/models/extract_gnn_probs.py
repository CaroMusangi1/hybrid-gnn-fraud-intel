import torch
import pandas as pd
import numpy as np
from torch_geometric.nn import SAGEConv, to_hetero

print(" Step 1: Probability Distillation (Extracting GNN Brain) ")

# 1. Load Data
data = torch.load('data/processed/hetero_graph.pt', weights_only=False)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
data = data.to(device)

# 2. Rebuild Architecture
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

all_edges = data['user', 'p2p', 'user'].edge_index
all_labels = data['user', 'p2p', 'user'].y.float()

# 3. Train the Model quickly (80/20 split logic to match everything else)
np.random.seed(42)
num_edges = all_edges.size(1)
indices = np.random.permutation(num_edges)
train_size = int(0.8 * num_edges)
train_idx = indices[:train_size]

train_edges = all_edges[:, train_idx]
train_labels = all_labels[train_idx]

model = HybridGNN(hidden_channels=64).to(device)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

pos_weight = (len(train_labels) - train_labels.sum()) / train_labels.sum()
criterion = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

print("Training GNN to generate probabilities...")
model.train()
for epoch in range(1, 101):
    optimizer.zero_grad()
    out = model(data.x_dict, data.edge_index_dict, train_edges, 'user', 'user')
    loss = criterion(out, train_labels)
    loss.backward()
    optimizer.step()

# 4. DISTILLATION: Predict on 100% of the edges
print("Extracting probabilities for all transactions...")
model.eval()
with torch.no_grad():
    all_out = model(data.x_dict, data.edge_index_dict, all_edges, 'user', 'user')
    all_probabilities = torch.sigmoid(all_out).cpu().numpy()

# 5. Save the Single Column
probs_df = pd.DataFrame({'gnn_fraud_risk_score': all_probabilities})
probs_df.to_csv('data/processed/gnn_probabilities.csv', index=False)
print("-> SUCCESS! Saved gnn_probabilities.csv")
import torch

# Load the graph (using weights_only=False due to the new PyTorch security rule)
data = torch.load('data/processed/hetero_graph.pt', weights_only=False)

# 1. Check User Features
user_features = data['user'].x
print(f"User Matrix Shape: {user_features.shape}")
print(f"Any NaNs in Users?: {torch.isnan(user_features).any().item()}")

# 2. Check Transaction Amounts (Should be normalized, roughly between -3 and 3)
p2p_amounts = data['user', 'p2p', 'user'].edge_attr
print(f"P2P Amounts Min: {p2p_amounts.min().item():.4f}")
print(f"P2P Amounts Max: {p2p_amounts.max().item():.4f}")
print(f"Any NaNs in Amounts?: {torch.isnan(p2p_amounts).any().item()}")
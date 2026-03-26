import os
import torch
import pandas as pd
import pytest
from torch_geometric.data import HeteroData
from torch_geometric.nn import SAGEConv, to_hetero

print(" Week 4: GNN Architecture Unit Tests ")

#  MOCK ARCHITECTURE 
# We recreate just the mathematical core of our GNN to test it in isolation
class GNNEncoder(torch.nn.Module):
    def __init__(self, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv((-1, -1), hidden_channels)
        self.conv2 = SAGEConv((-1, -1), out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index)
        return x

@pytest.fixture
def micro_graph():
    """Creates a tiny 3-user graph for inference and forward pass testing."""
    data = HeteroData()
    # 3 users, 13 features each (matching your exact Phase 1.9 architecture)
    data['user'].x = torch.rand(3, 13)
    # User 0 sends to User 1, User 1 sends to User 2
    data['user', 'p2p', 'user'].edge_index = torch.tensor([[0, 1], [1, 2]], dtype=torch.long)
    return data


#  1 & 4. TEST FORWARD PASS & INFERENCE ON SMALL DATASET 
def test_forward_pass_and_inference(micro_graph):
    """Proves the GNN can successfully process a small dataset without crashing."""
    # Initialize the engine with 64 hidden dimensions
    encoder = GNNEncoder(hidden_channels=64, out_channels=64)
    encoder = to_hetero(encoder, micro_graph.metadata(), aggr='mean')
    
    # Run the Forward Pass!
    with torch.no_grad():
        out_dict = encoder(micro_graph.x_dict, micro_graph.edge_index_dict)
    
    # Assert the engine didn't crash and actually output data
    assert 'user' in out_dict, "Forward pass failed to generate user embeddings."
    
    # Assert it properly mapped 3 users to 64 dimensions
    assert out_dict['user'].shape == (3, 64), f"Inference Error: Expected shape (3, 64), got {out_dict['user'].shape}"


# 3. TEST LOSS COMPUTATION 
def test_loss_computation():
    """Proves the Binary Cross Entropy math works for fraud classification."""
    # We use pos_weight=34.0 just like your real training script!
    criterion = torch.nn.BCEWithLogitsLoss(pos_weight=torch.tensor([34.0]))
    
    # Mock some raw outputs from the GNN (Logits)
    mock_predictions = torch.tensor([0.5, -1.2, 2.3]) 
    # Mock actual truth (1 = fraud, 0 = safe)
    mock_labels = torch.tensor([1.0, 0.0, 1.0])
    
    loss = criterion(mock_predictions, mock_labels)
    
    # Assert loss is a valid float and not broken math (NaN)
    assert loss.item() > 0 or loss.item() < 0, "Loss computation failed."
    assert not torch.isnan(loss), "Loss computed as NaN (Not a Number)."


# 2. TEST EMBEDDING DIMENSIONS (On the Real Data) 
def test_embedding_dimensions():
    """Tests if your actual training script saved the correct 64-D shapes."""
    embed_file = 'data/processed/user_embeddings.csv'
    
    assert os.path.exists(embed_file), "Embeddings file missing! Did training complete?"
    
    df = pd.read_csv(embed_file)
    
    # 1 ID column + 64 dimension columns = 65 total columns
    assert df.shape[1] == 65, f"Architecture Error: Expected 65 columns, got {df.shape[1]}"
    
    # Ensure all 10,000 of your users made it out safely
    assert len(df) == 10000, f"Data loss detected! Expected 10,000 users, got {len(df)}"
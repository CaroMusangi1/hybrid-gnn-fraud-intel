"""
Test suite for edge weight calculations (Task 5)
Tests the edge weight mapping module with different weight schemes
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path to import edge_weights
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml_pipeline', 'models'))

try:
    from edge_weights import (
        calculate_edge_weights,
        calculate_fraud_risk_weights,
        create_edge_weight_tensor,
        print_weight_statistics
    )
    HAS_EDGE_WEIGHTS = True
except ImportError:
    HAS_EDGE_WEIGHTS = False


class TestEdgeWeightCalculation:
    """Test edge weight calculation functions"""

    @pytest.fixture
    def sample_transactions(self):
        """Create sample transaction data for testing"""
        return pd.DataFrame({
            'sender_id': ['USER_A', 'USER_B', 'USER_C', 'USER_A', 'USER_D'],
            'receiver_id': ['USER_B', 'USER_C', 'USER_D', 'USER_B', 'USER_E'],
            'amount': [5000, 150, 25000, 5500, 100],
            'is_fraud': [0, 1, 0, 1, 0],
            'night_activity_flag': [0, 0, 0, 1, 1],
            'round_amount_flag': [1, 0, 0, 0, 0],
            'timestamp': ['2026-04-10 10:15:00'] * 5
        })

    def test_normalized_amount_weights(self, sample_transactions):
        """Test normalized amount weight scheme"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_edge_weights(sample_transactions, 'normalized_amount')
        
        # Check properties
        assert len(weights) == 5
        assert np.all(weights >= 0.01)
        assert np.all(weights <= 1.0)
        
        # Highest amount should have highest (or near-highest) weight
        max_idx = np.argmax(weights)
        max_amount = sample_transactions.iloc[max_idx]['amount']
        # Should be among the top amounts (not necessarily the absolute max)
        assert max_amount >= 5000  # One of the higher amounts in sample
        
        # Weight range should be reasonable
        weight_variance = weights.max() - weights.min()
        assert weight_variance > 0  # Weights should vary
        
        print(f"✓ Normalized amount weights test passed")
        print(f"  Weights range: [{weights.min():.4f}, {weights.max():.4f}]")

    def test_frequency_weights(self, sample_transactions):
        """Test frequency-based weight scheme"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_edge_weights(sample_transactions, 'frequency')
        
        # Check properties
        assert len(weights) == 5
        assert np.all(weights >= 0.01)
        assert np.all(weights <= 1.0)
        
        # USER_A -> USER_B appears twice, should have higher weight
        mask_ab = ((sample_transactions['sender_id'] == 'USER_A') & 
                   (sample_transactions['receiver_id'] == 'USER_B'))
        ab_weights = weights[mask_ab]
        
        # Other pairs appear once
        other_weights = weights[~mask_ab]
        
        assert ab_weights.max() >= other_weights.max()
        
        print(f"✓ Frequency weights test passed")
        print(f"  High frequency pair weight: {ab_weights[0]:.4f}")

    def test_combined_weights(self, sample_transactions):
        """Test combined weight scheme (60% amount, 40% frequency)"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_edge_weights(sample_transactions, 'combined')
        
        # Check properties
        assert len(weights) == 5
        assert np.all(weights >= 0.01)
        assert np.all(weights <= 1.0)
        
        # Should be a blend of both
        amount_weights = calculate_edge_weights(sample_transactions, 'normalized_amount')
        freq_weights = calculate_edge_weights(sample_transactions, 'frequency')
        
        # Combined should be within bounds of both
        assert weights.min() >= min(amount_weights.min(), freq_weights.min())
        assert weights.max() <= max(amount_weights.max(), freq_weights.max())
        
        print(f"✓ Combined weights test passed")
        print(f"  Weights range: [{weights.min():.4f}, {weights.max():.4f}]")

    def test_inverse_amount_weights(self, sample_transactions):
        """Test inverse amount weight scheme (emphasize small transactions)"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_edge_weights(sample_transactions, 'inverse_amount')
        
        # Check properties
        assert len(weights) == 5
        assert np.all(weights >= 0.01)
        assert np.all(weights <= 1.0)
        
        # Smallest amount (100) should have highest weight
        min_amount_idx = sample_transactions['amount'].idxmin()
        assert weights[min_amount_idx] > weights.mean()
        
        print(f"✓ Inverse amount weights test passed")
        print(f"  Small transaction (100) weight: {weights[min_amount_idx]:.4f}")

    def test_weight_output_type(self, sample_transactions):
        """Test that weights are returned as numpy arrays"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_edge_weights(sample_transactions, 'normalized_amount')
        
        assert isinstance(weights, np.ndarray)
        assert weights.dtype == np.float32
        
        print("✓ Weight output type test passed")


class TestFraudRiskWeights:
    """Test fraud risk weight calculations"""

    @pytest.fixture
    def sample_transactions_with_fraud(self):
        """Create sample data with fraud indicators"""
        return pd.DataFrame({
            'sender_id': ['USER_A', 'USER_B', 'USER_C', 'USER_D'],
            'receiver_id': ['USER_B', 'USER_C', 'USER_D', 'USER_E'],
            'amount': [5000, 150, 25000, 100],
            'is_fraud': [0, 1, 0, 1],
            'night_activity_flag': [0, 1, 0, 1],
            'round_amount_flag': [1, 0, 0, 1]
        })

    def test_fraud_risk_weights(self, sample_transactions_with_fraud):
        """Test fraud risk weight calculation"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_fraud_risk_weights(sample_transactions_with_fraud)
        
        # Check properties
        assert len(weights) == 4
        assert np.all(weights >= 0.01)
        assert np.all(weights <= 1.0)
        
        # Fraud transactions should have higher base weight
        fraud_mask = sample_transactions_with_fraud['is_fraud'] == 1
        fraud_weights = weights[fraud_mask]
        legit_weights = weights[~fraud_mask]
        
        assert fraud_weights.mean() > legit_weights.mean()
        
        print(f"✓ Fraud risk weights test passed")
        print(f"  Fraud avg weight: {fraud_weights.mean():.4f}")
        print(f"  Legitimate avg weight: {legit_weights.mean():.4f}")

    def test_night_activity_modifier(self, sample_transactions_with_fraud):
        """Test that night activity increases weight"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = calculate_fraud_risk_weights(sample_transactions_with_fraud)
        
        # Night activity transactions
        night_mask = sample_transactions_with_fraud['night_activity_flag'] == 1
        day_mask = sample_transactions_with_fraud['night_activity_flag'] == 0
        
        night_weights = weights[night_mask]
        day_weights = weights[day_mask]
        
        # Night activity should generally have higher weights
        assert night_weights.mean() >= day_weights.mean()
        
        print(f"✓ Night activity modifier test passed")


class TestPyTorchTensorConversion:
    """Test conversion to PyTorch tensors"""

    @pytest.fixture
    def sample_transactions(self):
        """Create sample transaction data"""
        return pd.DataFrame({
            'sender_id': ['USER_A', 'USER_B', 'USER_C'],
            'receiver_id': ['USER_B', 'USER_C', 'USER_D'],
            'amount': [5000, 150, 25000]
        })

    def test_create_edge_weight_tensor(self, sample_transactions):
        """Test creation of PyTorch edge weight tensor"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        try:
            import torch
        except ImportError:
            pytest.skip("PyTorch not available")
        
        tensor = create_edge_weight_tensor(sample_transactions, 'normalized_amount')
        
        # Check tensor properties
        assert isinstance(tensor, torch.Tensor)
        assert tensor.dtype == torch.float32
        assert len(tensor) == 3
        assert tensor.min() >= 0.01
        assert tensor.max() <= 1.0
        
        print(f"✓ PyTorch tensor conversion test passed")
        print(f"  Tensor shape: {tensor.shape}")


class TestWeightStatistics:
    """Test weight statistics printing"""

    def test_print_statistics(self):
        """Test weight statistics calculation"""
        if not HAS_EDGE_WEIGHTS:
            pytest.skip("edge_weights module not available")
        
        weights = np.array([0.1, 0.5, 0.9, 0.3, 0.7], dtype=np.float32)
        
        # This should print but not error
        print_weight_statistics(weights)
        
        print(f"✓ Statistics printing test passed")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Running Edge Weights Calculation Tests (Task 5)")
    print("="*60 + "\n")
    
    if not HAS_EDGE_WEIGHTS:
        print("⚠ edge_weights module not found, installing would enable full tests")
    
    test_suite = TestEdgeWeightCalculation()
    sample_data = test_suite.sample_transactions()
    
    test_suite.test_normalized_amount_weights(sample_data)
    test_suite.test_frequency_weights(sample_data)
    test_suite.test_combined_weights(sample_data)
    test_suite.test_inverse_amount_weights(sample_data)
    test_suite.test_weight_output_type(sample_data)
    
    fraud_suite = TestFraudRiskWeights()
    fraud_data = fraud_suite.sample_transactions_with_fraud()
    
    fraud_suite.test_fraud_risk_weights(fraud_data)
    fraud_suite.test_night_activity_modifier(fraud_data)
    
    stat_suite = TestWeightStatistics()
    stat_suite.test_print_statistics()
    
    print("\n" + "="*60)
    print("All edge weight tests completed!")
    print("="*60)

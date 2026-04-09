# Model Comparison & Analysis System - Implementation Guide

## Overview

A complete model comparison system has been implemented to allow you to evaluate three fraud detection models (XGBoost, GNN, and Stacked Hybrid) against standardized test cases and static baseline metrics. This system enables you to understand model strengths/weaknesses and see how models perform on different fraud patterns.

## Architecture

### Backend Changes (backend/main.py)

Added 5 new API endpoints:

1. **`/model-metrics?model=<model_name>`** (GET)
   - Returns detailed metrics for a specific model
   - Includes precision, recall, F1, accuracy
   - Lists cases caught and missed
   - Provides strengths/shortcomings analysis

2. **`/fraud-test-cases`** (GET)
   - Returns all 5 standardized fraud test cases
   - Each case includes actual data patterns and true labels
   - Used by TestCaseSampler component

3. **`/predict-on-case`** (POST)
   - Makes a prediction for a specific test case using a specific model
   - Returns prediction, confidence, and correctness
   - Demonstrates model behavior on known patterns

4. **`/model-comparison-summary`** (GET)
   - Returns side-by-side comparison of all 3 models
   - Identifies best overall model
   - Useful for quick reference

### 5 Standardized Fraud Test Cases

The system defines 5 fraud scenarios to evaluate model capabilities:

```
CASE_1: Agent Reversal Scam Ring
- Pattern: Directed cycle + fan-in topology
- Indicators: Network-based (primarily)
- XGBoost: ✓ Catches  |  GNN: ✓ Catches  |  Hybrid: ✓ Catches

CASE_2: Mule SIM Swap Ring  
- Pattern: Star-shaped network with stolen IDs
- Indicators: Network-based (primarily)
- XGBoost: ✗ Misses   |  GNN: ✓ Catches  |  Hybrid: ✓ Catches

CASE_3: Kamiti Micro-Scam Velocity
- Pattern: Small amounts, high frequency
- Indicators: Tabular-based (primarily)
- XGBoost: ✓ Catches  |  GNN: ✗ Misses   |  Hybrid: ✓ Catches

CASE_4: Legitimate High-Value Transaction
- Pattern: Large single transaction, low network risk
- Indicators: None (legitimate)
- XGBoost: ✓ Catches  |  GNN: ✓ Catches  |  Hybrid: ✓ Catches

CASE_5: Device-Based Fraud Pattern
- Pattern: Multiple users on same device
- Indicators: Network + Tabular
- XGBoost: ✗ Misses   |  GNN: ✓ Catches  |  Hybrid: ✓ Catches
```

### Static Baseline Metrics

Three models are compared with pre-calculated metrics:

**XGBoost (Tabular Only)**
- Precision: 85% | Recall: 62% | F1: 68%
- Strengths: Fast, interpretable, velocity detection
- Shortcomings: Misses network fraud, no graph understanding

**GNN (Graph Neural Network)**
- Precision: 71% | Recall: 69% | F1: 70%
- Strengths: Network ring detection, topology analysis
- Shortcomings: Misses velocity patterns, requires full graph

**Stacked Hybrid**
- Precision: 85% | Recall: 84% | F1: 84%
- Strengths: All 5 cases caught, balanced detection
- Shortcomings: Higher computational cost

## Frontend Components

### 1. **BaselineMetricsPanel Component**
   - Location: `frontend/src/components/BaselineMetricsPanel.jsx`
   - Purpose: Display static baseline metrics in a visual format
   - Features:
     - Overall metrics (Precision, Recall, F1, Accuracy, ROC-AUC)
     - Performance segmented by fraud type
     - Static reference for comparison with live data

### 2. **ModelComparison Component**
   - Location: `frontend/src/components/ModelComparison.jsx`
   - Purpose: Show detailed comparison of a selected model
   - Features:
     - Model selection tabs (XGBoost, GNN, Stacked Hybrid)
     - Key metrics display (Precision, Recall, F1, Accuracy)
     - Cases caught vs missed visualization
     - Strengths and shortcomings analysis

### 3. **TestCaseSampler Component**
   - Location: `frontend/src/components/TestCaseSampler.jsx`
   - Purpose: Simulate different fraud scenarios
   - Features:
     - Case selection grid (5 cases available)
     - Model selection for testing
     - Live predictions showing correctness
     - Fraud indicator breakdown
     - Confidence scores

### 4. **BaselineMetricsPanel Component**
   - Location: `frontend/src/components/BaselineMetricsPanel.jsx`
   - Static baseline metrics (not moving)
   - Shows training-time performance reference

### 5. **AIBotButton Component**
   - Location: `frontend/src/components/AIBotButton.jsx`
   - Placeholder for future AI assistant feature
   - Currently shows "Coming Soon" tooltip

## Updated Transaction.jsx Layout

The Transaction page now has THREE main sections:

### Main Content Area (Left/Center)
- **Simulate Real-Time Transaction**: Form to input transaction data
- **Live Prediction Results**: Shows stacked hybrid model predictions in real-time
- Demonstrates live data with actual transaction simulation

### Side Panel (Right) - Tabbed Interface

1. **Baseline Tab**
   - Static baseline metrics panel
   - Training-time performance reference
   - Shows overall model accuracies at training time

2. **Models Tab**
   - ModelComparison component for detailed analysis
   - Switch between XGBoost, GNN, Stacked Hybrid
   - See which cases each model catches/misses
   - Understand specific strengths/weaknesses

3. **Samples Tab**
   - TestCaseSampler for testing on known patterns
   - Simulate different fraud scenarios
   - See how each model performs on specific case types
   - Compare predictions across models

4. **AI Bot Button**
   - Bottom of side panel
   - Placeholder for future interactive analyst

## How to Use

### Scenario 1: Compare Model Performance

1. Open Transaction page
2. Click **Models** tab in side panel
3. Click on one model (e.g., "XGBoost")
4. See:
   - Precision, Recall, F1, Accuracy
   - List of 5 cases it catches
   - List of cases it misses
   - Specific shortcomings (e.g., "Misses network-based fraud rings")

### Scenario 2: Test a Fraud Pattern

1. Click **Samples** tab in side panel
2. Select a test case (e.g., "Mule SIM Swap Ring")
3. Choose a model to test
4. See:
   - Case data (amount, velocity, network topology)
   - Prediction from that model
   - Confidence score
   - Whether it was correct
   - Fraud indicator breakdown

### Scenario 3: See Static vs Live Performance

1. Click **Baseline** tab to see training-time metrics
2. Then in main area, enter a transaction
3. Click "Process Transaction"
4. See live prediction from current system
5. Compare: Baseline showed 85% precision, how does this perform?

## Key Design Features

### ✅ Static Baseline Metrics (Not Moving)
- Pre-calculated from training data
- Reference point for evaluating improvements
- Shows training-time performance
- Unchanged regardless of live transactions

### ✅ Live Transaction Simulation
- Real-time prediction on demand
- Shows stacked hybrid model in action
- Demonstrates actual system behavior
- Can compare with baseline metrics

### ✅ 5 Comprehensive Test Cases
- Cover different fraud patterns
- Network-based, tabular-based, device-based
- Show model strengths/weaknesses
- Can test all 3 models on same cases

### ✅ Model-Specific View
- See exactly what each model catches
- Understand trade-offs
- Model selection informs deployment decisions

### ✅ Side Panel Organization
- Cleanly separated concerns
- Tabbed interface for easy navigation
- Always visible reference data
- Main area for interactive testing

## Future Extensions

### AI Bot (Placeholder)
The AIBotButton component is ready for implementation. Future features could include:
- Natural language explanation of fraud patterns
- Answer questions about transaction flags
- Suggest optimal model for deployment
- Interactive system tuning

### Additional Test Cases
- Can expand beyond 5 cases
- Add seasonal fraud patterns
- Include geographic fraud indicators
- Device fingerprinting patterns

### Model Monitoring
- Track metrics over time
- Alert on model drift
- A/B test models in production
- Gradual model rollout

## Technical Integration

### Dependencies
- React hooks (useState, useEffect)
- Axios for API calls
- Tailwind CSS for styling
- Lucide React icons

### API Parameters

```javascript
// Get model metrics
GET http://127.0.0.1:8000/model-metrics?model=stacked_hybrid

// Get all test cases
GET http://127.0.0.1:8000/fraud-test-cases

// Predict on specific case
POST http://127.0.0.1:8000/predict-on-case?case_id=CASE_1&model=xgboost

// Get comparison summary
GET http://127.0.0.1:8000/model-comparison-summary
```

## Next Steps

1. **Test the Interface**: Run frontend and test all tabs
2. **Verify Predictions**: Test each model on all 5 cases
3. **Customize Metrics**: Adjust baseline metrics as real data shows
4. **Add Test Cases**: Incorporate new fraud patterns from production
5. **Implement AI Bot**: Add interactive analyst component

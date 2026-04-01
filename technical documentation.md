# Technical Documentation: Hybrid GNN Fraud Intelligence Journey

## 1. Goal and Thesis
Build a real-time fraud detection pipeline for mobile money ecosystems that combines graph neural networks (GNNs) with traditional tabular classification. The system aims to detect complex fraud topologies including fraud rings, synthetic identities, mule accounts, fast cash-outs, and loan fraud patterns that traditional tabular methods miss.

**Core Hypothesis:** A hybrid GNN + XGBoost model outperforms pure tabular baselines on graph-based fraud detection while maintaining operational feasibility for real-time deployment.

## 2. Repository Layout (Current Implementation Status)
- **`streaming/`**: Kafka-based transaction streaming (producer/consumer scripts - currently placeholder)
- **`ml_pipeline/data_gen/`**: Synthetic data generation with 5 fraud typologies
- **`ml_pipeline/models/`**:
  - `baseline_xgboost.py`: Tabular-only baseline using engineered features
  - `evaluate_gnn.py`: Heterogeneous GraphSAGE GNN for edge-level fraud classification
  - `stacked_hybrid.py`: Hybrid model stacking GNN probabilities with tabular features
- **`backend/`**: FastAPI skeleton with Neo4j integration (requirements: neo4j, pandas, numpy)
- **`frontend/`**: React + Tailwind CSS dashboard structure (currently placeholder)
- **`data/processed/`**: Expected location for model artifacts (final_model_data.csv, hetero_graph.pt, gnn_probabilities.csv)
- **`tests/`**: Unit tests for GNN architecture validation
- **`docs/`**: System design document with fraud typology specifications
- **`notebooks/`**: Jupyter exploration notebooks (currently placeholder)

## 3. Data Generation Pipeline (`ml_pipeline/data_gen/generate_data.py`)
**Dataset Specifications:**
- 10,000 users, 100,000 transactions, 400 agents, 5,000 devices
- 2.5% fraud rate (2,500 fraudulent transactions)
- 45-day temporal window for burst detection
- 5 distinct fraud typologies with mathematical proportions:

**Fraud Typologies Implemented:**
1. **Fraud Rings (25%)**: Cyclic transactions between 4+ users with elevated amounts
2. **Mule/SIM Swap (20%)**: Star topology with shared device identifiers
3. **Fast Cash-out (20%)**: High-velocity bursts within 60-second windows
4. **Loan Fraud (15%)**: Dense communities with homophilous default patterns
5. **Business Fraud (20%)**: Unusual densification between users and business tills

**Output:** `data/raw/p2p_transfers.csv` with columns: sender_id, receiver_id, amount, timestamp, agent_id, device_id, is_fraud, fraud_scenario

## 4. Model Scripts Analysis

### **Evolution of Model Development**

The project demonstrates a systematic progression from basic tabular classification to advanced hybrid graph-neural approaches, with each script representing a key milestone in the research journey.

#### **4.1 Initial XGBoost Classifier (`xgboost_classifier.py`)**
**Purpose:** Proof-of-concept tabular baseline using Neo4j data extraction
- **Data Source:** Direct Neo4j Cypher queries extracting transaction metadata
- **Features:** Transaction type, sender age, KYC level, default status
- **Architecture:** Basic XGBClassifier with manual encoding and imbalance handling
- **Evaluation:** Scenario-specific recall analysis showing limitations on graph-based fraud
- **Key Innovation:** First empirical proof that tabular methods struggle with connected fraud patterns

#### **4.2 GNN Embeddings Training (`gnn_embeddings.py`)**
**Purpose:** Generate structural embeddings from transaction graphs
- **Architecture:** 
  - `GNNEncoder`: 2-layer GraphSAGE (64D hidden → 64D output)
  - Heterogeneous conversion using `to_hetero()` for multi-entity graphs
- **Training:** Full graph training on 100K transactions with imbalance weighting
- **Output:** `user_embeddings.csv` with 64-dimensional structural features per user
- **Key Innovation:** Converts graph topology into tabular features for downstream ML

#### **4.3 Graph Dataset Construction (`graph_dataset.py`)**
**Purpose:** Convert CSV data to PyTorch Geometric tensors
- **Node Features:** 13 engineered features (tabular + graph metrics)
- **Edge Construction:** User-to-user P2P transaction edges
- **Normalization:** StandardScaler for neural network compatibility
- **Output:** `hetero_graph.pt` PyTorch HeteroData object
- **Key Innovation:** Bridges feature engineering with GNN training pipeline

#### **4.4 GNN Evaluation (`evaluate_gnn.py`)**
**Purpose:** Standalone GNN performance assessment
- **Architecture:** Same as embeddings script but with edge-level classification
- **Split:** 80/20 edge-based train/test with seed=42 reproducibility
- **Training:** 100 epochs with BCEWithLogitsLoss and pos_weight balancing
- **Evaluation:** ROC-AUC, classification report, scenario-specific recall
- **Key Innovation:** Quantifies GNN's ability to detect fraud rings missed by tabular methods

#### **4.5 Hybrid XGBoost (`hybrid_xgboost.py`)**
**Purpose:** Direct fusion of tabular features with GNN embeddings
- **Fusion Method:** Merge GNN embeddings (64D) with tabular features per sender
- **Architecture:** XGBClassifier trained on concatenated feature space
- **Evaluation:** Scenario-specific recall comparison with baseline
- **Key Innovation:** First hybrid approach proving graph features improve detection

#### **4.6 GNN Probability Extraction (`extract_gnn_probs.py`)**
**Purpose:** Generate edge-level fraud probabilities for stacking
- **Process:** Train GNN → predict on all edges → extract sigmoid probabilities
- **Output:** `gnn_probabilities.csv` with single fraud risk score per transaction
- **Key Innovation:** Distills GNN decisions into scalar features for meta-learning

#### **4.7 Stacked Hybrid (`stacked_hybrid.py`)**
**Purpose:** Production-ready stacked ensemble with business logic
- **Stacking:** Concatenate tabular features with GNN probabilities
- **Hyperparameters:** Tuned for production (150 estimators, depth=4, lr=0.05)
- **Business Logic:** Traffic light system (auto-freeze ≥0.85, review 0.25-0.85, safe <0.25)
- **Tier-2 Handoff:** Exports `review_queue.csv` for human-AI collaboration
- **Key Innovation:** Operational deployment with analyst workload optimization

#### **4.8 AI Fraud Analyst (`ai_fraud_analyst.py`)**
**Purpose:** Automated Tier-2 analysis using Kenyan behavioral rules
- **Rules Engine:** Domain-specific logic for M-Pesa fraud patterns
- **Processing:** Analyzes review queue with contextual business rules
- **Decisions:** CONFIRMED_FRAUD, AUTO_CLEARED_SAFE, REQUIRE_HUMAN
- **Impact Analysis:** Quantifies false alarm reduction and analyst workload
- **Key Innovation:** Domain expertise automation reducing human intervention

#### **4.9 Manual Inspection (`manual_inspect.py`)**
**Purpose:** Architecture validation and debugging
- **Tests:** Forward pass verification, embedding dimensions, inference on samples
- **Output:** Mathematical health checks and tensor shape validation
- **Key Innovation:** Quality assurance for GNN pipeline reliability

#### **4.10 Feature Importance Visualization (`visualize_importance.py`)**
**Purpose:** Explain hybrid model decisions
- **Method:** XGBoost feature importance on stacked feature space
- **Visualization:** Bar chart of top 10 features by F-score
- **Output:** `feature_importance.png` showing GNN probability dominance
- **Key Innovation:** Interpretability for graph-enhanced tabular models

### **Legacy Baseline XGBoost (`baseline_xgboost.py`)**
**Purpose:** Current production baseline excluding graph features
- **Features Used:** amount, num_accounts_linked, shared_device_flag, avg_transaction_amount, transaction_frequency, num_unique_recipients, transactions_last_24hr, round_amount_flag, night_activity_flag
- **Graph Features Excluded:** triad_closure_score, pagerank_score, in_degree, out_degree, cycle_indicator
- **Training:** XGBoost with scale_pos_weight for class imbalance (pos_weight = neg/pos)
- **Evaluation:** Scenario-specific recall analysis showing blind spots on graph-based fraud
- **Expected Weakness:** Poor detection of fraud rings and connected topologies

## 5. Testing Framework (`tests/test_gnn.py`)
**Unit Tests Cover:**
1. **Forward Pass Validation:** Micro-graph (3 users) inference testing
2. **Loss Computation:** BCEWithLogitsLoss with pos_weight verification
3. **Embedding Dimensions:** Validates 64D user embeddings from training
4. **Data Integrity:** Confirms 10,000 users processed correctly

**Testing Approach:** Isolated mathematical core testing without full pipeline dependencies

## 6. Technology Stack (Implemented Components)
- **ML Framework:** PyTorch Geometric, Scikit-Learn, XGBoost
- **Data Processing:** Pandas, NumPy
- **Graph Database:** Neo4j (backend integration ready)
- **API Framework:** FastAPI (skeleton implemented)
- **Frontend:** React + Tailwind CSS (structure defined)
- **Streaming:** Kafka (producer/consumer placeholders)
- **Deployment:** Docker Compose (configuration pending)

## 7. End-to-End Pipeline Flow
1. **Data Generation:** `generate_data.py` → `data/raw/p2p_transfers.csv`
2. **Feature Engineering:** Graph construction and tabular feature extraction (pending implementation)
3. **Model Training:**
   - `baseline_xgboost.py` → Tabular baseline performance
   - `evaluate_gnn.py` → GNN training → `hetero_graph.pt`, `gnn_probabilities.csv`
   - `stacked_hybrid.py` → Hybrid stacking → `review_queue.csv`
4. **Validation:** `test_gnn.py` → Architecture verification
5. **Deployment:** FastAPI serving with Neo4j persistence (pending)

## 8. Key Research Contributions
- **Empirical Proof:** Quantified performance gains on graph fraud vs tabular baselines
- **Scenario Analysis:** Per-topology recall metrics for fraud rings, fast cash-outs, etc.
- **Operational Feasibility:** Human-in-the-loop design with workload quantification
- **Scalability:** PyTorch Geometric for large graph processing
- **Explainability:** GNN architecture supports future GNNExplainer integration

## 9. Current Development Status
- ✅ Synthetic data generation with realistic fraud patterns
- ✅ Core ML models (baseline, GNN, hybrid) fully implemented
- ✅ Unit testing framework established
- ✅ Backend skeleton with Neo4j integration
- ⏳ Feature engineering pipeline (graph construction, tabular features)
- ⏳ Kafka streaming implementation
- ⏳ Frontend dashboard development
- ⏳ Docker orchestration configuration

## 10. How to Run (Current State)
```bash
# Activate virtual environment
& venv\Scripts\Activate.ps1

# Generate synthetic data
python ml_pipeline/data_gen/generate_data.py

# Build graph dataset
python ml_pipeline/models/graph_dataset.py

# Train GNN embeddings
python ml_pipeline/models/gnn_embeddings.py

# Extract GNN probabilities
python ml_pipeline/models/extract_gnn_probs.py

# Run model evaluations
python ml_pipeline/models/xgboost_classifier.py    # Initial baseline
python ml_pipeline/models/baseline_xgboost.py      # Upgraded baseline
python ml_pipeline/models/hybrid_xgboost.py        # Direct embedding fusion
python ml_pipeline/models/evaluate_gnn.py          # Standalone GNN
python ml_pipeline/models/stacked_hybrid.py        # Production hybrid

# Run AI analyst (requires review_queue.csv from stacked_hybrid.py)
python ml_pipeline/models/ai_fraud_analyst.py

# Manual inspection and validation
python ml_pipeline/models/manual_inspect.py

# Generate feature importance visualization
python ml_pipeline/models/visualize_importance.py

# Run tests
pytest tests/test_gnn.py
```

## 11. Future Development Roadmap
- Complete feature engineering pipeline (`ml_pipeline/features/`, `ml_pipeline/graph_builder/`)
- Implement Kafka streaming in `streaming/` folder
- Build FastAPI endpoints in `backend/`
- Develop React dashboard in `frontend/`
- Configure Docker Compose for full-stack deployment
- Add model monitoring and A/B testing capabilities

## 12. Model Evolution Summary

The `ml_pipeline/models/` folder contains 11 scripts representing a complete research-to-production pipeline:

**Phase 1: Foundation (Neo4j Integration)**
- `xgboost_classifier.py`: Initial proof-of-concept with database queries

**Phase 2: Graph Learning**
- `graph_dataset.py`: Data preparation for GNN training
- `gnn_embeddings.py`: Structural embedding generation
- `manual_inspect.py`: Architecture validation

**Phase 3: Hybrid Approaches**
- `baseline_xgboost.py`: Tabular baseline (upgraded)
- `hybrid_xgboost.py`: Direct embedding fusion
- `extract_gnn_probs.py`: Probability distillation for stacking
- `evaluate_gnn.py`: Standalone GNN evaluation
- `stacked_hybrid.py`: Production-ready stacked ensemble

**Phase 4: Operational Intelligence**
- `ai_fraud_analyst.py`: Automated Tier-2 analysis
- `visualize_importance.py`: Model interpretability

**Key Progression:**
1. **Tabular → Graph**: From basic features to structural embeddings
2. **Fusion → Stacking**: From direct concatenation to meta-learning
3. **Research → Production**: From evaluation to operational deployment
4. **Single Model → System**: From ML to human-AI collaboration

This evolution demonstrates the systematic development of hybrid GNN-XGBoost fraud detection, from initial experiments to production deployment with business logic integration.*
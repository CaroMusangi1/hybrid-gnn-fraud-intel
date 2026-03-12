# System Design Document: Graph-Based Fraud Intelligence System

## 1. System Requirements
**Functional Requirements:**
* [cite_start]Detect organized fraud rings and synthetic identities within the mobile money ecosystem[cite: 128].
* [cite_start]Utilize dynamic graph representations of transaction relationships to identify fraud patterns[cite: 130].
* [cite_start]Perform real-time continuous graph updates and inferences[cite: 73].
* [cite_start]Provide explainability for human analyst feedback using tools like GNNExplainer[cite: 253, 255].

**Non-Functional Requirements:**
* [cite_start]Evaluate performance using AUROC, F1-score, and False Positive Rates[cite: 40, 42, 260].
* [cite_start]Ensure temporal latency is minimized for real-time responsiveness[cite: 261].

## 2. System Modules
* [cite_start]**Data Ingestion/Streaming:** Manages the transaction stream using Kafka[cite: 250].
* [cite_start]**Graph Construction:** Represents users, agents, devices, and institutions as nodes[cite: 235]. [cite_start]Transactions, loan disbursements, and reversal requests act as edges[cite: 236].
* **Model Development (Hybrid-GNN):**
    * [cite_start]*GNN Component:* Learns structural topology[cite: 242].
    * [cite_start]*Temporal Component:* Detects fast-cash-out and burst fraud[cite: 245].
    * [cite_start]*Tabular Classifier:* Uses XGBoost on engineered features[cite: 246].
* [cite_start]**Backend:** FastAPI for logic, API services, and model inference[cite: 250].
* [cite_start]**Frontend:** React and Tailwind CSS for the user interface[cite: 250].

## 3. Technology Stack
* [cite_start]**Core/Modeling:** Python, PyTorch Geometric, Scikit-Learn, DGL[cite: 250].
* [cite_start]**Database/Storage:** Neo4j, GraphDB[cite: 250].
* [cite_start]**Infrastructure:** Kafka (Streaming), Docker (Deployment)[cite: 250].

## 4. Modeled Fraud Typologies (Case Studies)
[cite_start]The graph data pipeline is engineered to detect the following specific structural anomalies:
1. [cite_start]**Agent Reversal Scam Rings:** Modeled as a directed cycle followed by a fan-in pattern and a reversal request edge[cite: 197, 202].
2. [cite_start]**Mule Accounts & SIM Swap:** Modeled as star-shaped subgraphs where multiple synthetic accounts are linked to the same device[cite: 204, 206].
3. [cite_start]**Fast Cash-out Explosion:** Modeled as a high-velocity star topology occurring within a strictly small time window[cite: 208, 211].
4. [cite_start]**Synecdoche Circles (Loan Fraud):** Modeled as dense covert communities (homophily) where users borrow from institutions (like Fuliza/M-Shwari) and default together[cite: 213, 216, 217].
5. [cite_start]**Fraudulent Business Till Transactions:** Modeled as unusual densification and self-monitoring transaction circles between specific users and business tills[cite: 221, 223, 224].

## 5. System Architecture & Database Schema
*(Insert your architecture diagram image here)*



**Graph Database Schema (Entity-Relationship Diagram):**
```mermaid
erDiagram
    %% Nodes
    USER {
        string user_id PK
        int account_age_days
        string kyc_level
        boolean has_defaulted
    }
    AGENT {
        string agent_id PK
        string agent_type "Cash_Agent or Business_Till"
        string location
    }
    DEVICE {
        string device_id PK
        boolean is_rooted
    }
    INSTITUTION {
        string institution_id PK
        string name "e.g., Fuliza, M-Shwari"
    }

    %% Edges (Relationships)
    USER ||--o{ P2P_TRANSFER : initiates
    USER ||--o{ REVERSAL_REQUEST : disputes_transfer
    USER ||--o{ PAYMENT : pays_at_till
    USER ||--o{ WITHDRAWAL : cashes_out
    USER }o--|| DEVICE : uses
    INSTITUTION ||--o{ LOAN_DISBURSEMENT : issues_to
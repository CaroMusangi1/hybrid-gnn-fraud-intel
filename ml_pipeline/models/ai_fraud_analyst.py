import pandas as pd

print("=== TIER 2: AUTONOMOUS AI FRAUD ANALYST ===")
print("Loading the Manual Review Queue from Tier 1 (Stacked Hybrid)...")

try:
    queue_df = pd.read_csv('data/processed/review_queue.csv')
except FileNotFoundError:
    print("ERROR: Could not find review_queue.csv. Please run stacked_hybrid.py first!")
    exit()

def mpesa_ai_analyst(row):
    # This is the COMBINED intelligence (GNN + Tabular) from Tier 1
    hybrid_prob = row['Probability'] 
    
    # Safely extract features 
    amount = row.get('amount', row.get('Amount', 500))
    velocity = row.get('transactions_last_24hr', 1)
    
    # --- KENYAN CASE STUDY LOGIC ---
    
    # RULE 1: The "M-Pesa Reversal / Kamiti" Scam (Micro-Scam)
    # Context: If the Hybrid Model is leaning toward fraud (>50%), and the amount 
    # is tiny but happening rapidly, this is a mass-scam testing numbers.
    if hybrid_prob > 0.50 and amount < 300 and velocity > 5:
        return 'CONFIRMED_FRAUD'
        
    # RULE 2: The "Kiosk / Mama Mboga" Normalcy Check
    # Context: If the Hybrid Model was only slightly suspicious (<50%), but it's 
    # a standard grocery payment amount with low velocity, clear the false alarm.
    elif hybrid_prob < 0.50 and 100 <= amount <= 3000 and velocity < 4:
        return 'AUTO_CLEARED_SAFE'
        
    # RULE 3: The "Wash-Wash / Real Estate" Ring Check
    # Context: Moving over 100,000 Ksh is a high-risk compliance issue. 
    # The AI is not allowed to clear this. A human MUST review it.
    elif amount > 100000:
        return 'REQUIRE_HUMAN'
        
    # RULE 4: The "Fuliza/Loan Limit" Siphon
    # Context: If the Hybrid Model is highly suspicious (>60%) and the amount 
    # perfectly matches a standard Fuliza limit drain (5k - 15k).
    elif hybrid_prob > 0.60 and 5000 <= amount <= 15000 and velocity > 2:
        return 'CONFIRMED_FRAUD'
        
    # Default: If the transaction doesn't perfectly fit, keep it for the human analyst.
    else:
        return 'REQUIRE_HUMAN'

# Process the queue
print("AI Agent is applying Kenyan behavioral business logic to the Hybrid output...")
queue_df['AI_Decision'] = queue_df.apply(mpesa_ai_analyst, axis=1)

# --- GENERATE THE DETAILED TOPOLOGY TABLE ---
print("\n--- AI Analyst Resolution by Fraud Topology ---")
print(f"{'Fraud Topology':<18} | {'Total Queue'} | {'Actual Fraud Inside'} | {'False Alarms Cleared'} | {'Fraud Caught'} | {'Sent to Human'}")
print("-" * 115)

topologies = queue_df['fraud_scenario'].unique()

for topo in topologies:
    topo_data = queue_df[queue_df['fraud_scenario'] == topo]
    total_in_queue = len(topo_data)
    
    # How many ACTUAL fraudsters are hiding in this specific queue?
    actual_fraud_inside = len(topo_data[topo_data['Actual'] == 1])
    
    # How many innocent people did the AI save from being frozen?
    false_alarms_cleared = len(topo_data[(topo_data['AI_Decision'] == 'AUTO_CLEARED_SAFE') & (topo_data['Actual'] == 0)])
    
    # How many actual fraudsters did the AI catch using the Kenyan rules?
    fraud_caught = len(topo_data[(topo_data['AI_Decision'] == 'CONFIRMED_FRAUD') & (topo_data['Actual'] == 1)])
    
    # How many tickets were left for humans?
    sent_to_human = len(topo_data[topo_data['AI_Decision'] == 'REQUIRE_HUMAN'])
    
    print(f"{topo:<18} | {total_in_queue:<11} | {actual_fraud_inside:<19} | {false_alarms_cleared:<20} | {fraud_caught:<12} | {sent_to_human}")

# --- FINAL SYSTEM IMPACT ---
print("\n--- Final System Impact ---")
total_false_alarms_cleared = len(queue_df[(queue_df['AI_Decision'] == 'AUTO_CLEARED_SAFE') & (queue_df['Actual'] == 0)])
total_fraud_caught = len(queue_df[(queue_df['AI_Decision'] == 'CONFIRMED_FRAUD') & (queue_df['Actual'] == 1)])
remaining_human_work = len(queue_df[queue_df['AI_Decision'] == 'REQUIRE_HUMAN'])

print(f"-> The AI Agent successfully verified and AUTO-CLEARED {total_false_alarms_cleared} innocent users.")
print(f"-> The AI Agent confidently CONFIRMED {total_fraud_caught} additional fraudsters.")
print(f"-> The human analyst workload was reduced to only {remaining_human_work} complex cases.")
print("-> Architecture Complete: The Hybrid Model detects, the AI Agent refines.")
# Sagarmala 2.0 - Enterprise Tendering & Evaluation Workflow

This document records the official 14-stage lifecycle of a Tender within the Sagarmala 2.0 Procurement system, designed to comply with RFP section 4.6.3.4 (Tendering & Bid Evaluation).

## The 14 Stages

### Phase 1: Preparation (Bidding Locked)
1. **DRAFT**
   - The tender is being written and constructed by the Tender Creator.
   - Bidders cannot see this tender.
2. **INTERNAL_APPROVAL**
   - The draft is sent to management (Tender Approver) for verification before it goes public.

### Phase 2: Live Operation
3. **PUBLISHED**
   - The tender is public. Bidders can view the requirements, but the official window to submit electronic bids might not be open yet depending on dates.
4. **CORRIGENDUM**
   - Paused state. Used when terms, dates, or documents are being actively amended after publishing.
5. **BID_SUBMISSION**
   - **Bidding is Unlocked.** 
   - Contractors use the portal to upload their Encrypted Documents, Technical Scores, and Financial Quotes.

### Phase 3: Evaluation (Bidding Locked)
6. **BID_CLOSING**
   - The submission deadline has passed. The vault is locked; no new bids can be accepted.
7. **TECHNICAL_EVALUATION**
   - The technical envelopes are unsealed. Technical Evaluators review PDFs and input finalized Technical Scores (0-100).
8. **FINANCIAL_EVALUATION**
   - The financial envelopes are unsealed. 
   - The system allows the **"Run L1/L2 AI Evaluation"** engine to be triggered, which sorts bidders by cost and algorithmically stamps the lowest bidder as L1.
9. **FINAL_EVALUATION**
   - Combined review of Tech/Financial scores to form a final consensus.

### Phase 4: Award & Closing
10. **APPROVAL**
    - The Ministry or SMFCL officially sanctions the Final Evaluation results.
11. **LOA_ISSUED**
    - The Letter of Award is sent to the L1 (Winning) bidder. 
    - *System automation:* The `award_date` is stamped to the current date.
12. **CONTRACT_GENERATED**
    - Final legal contracts and digital signatures are executed between the Port Authority and the Contractor.
13. **AWARDED**
    - The procurement phase ends, and project execution officially begins.
14. **CLOSED**
    - The tender is archived, immutable, and preserved for audit/compliance tracking.

--- 

## Core Access Controls (RBAC)

The system manages these steps across 8 targeted procurement roles:
- **Tender Creator**: Drafts and initiates.
- **Tender Approver**: Moves from Draft -> Published.
- **Bidder**: Only allowed to submit payload during BID_SUBMISSION. 
- **Technical Evaluator / Financial Evaluator**: Permitted to interact with evaluation engine.
- **Audit Officer / Compliance Officer**: Can view the immutable `tender_audit_log` trails.
- **Management**: Global viewpoint.

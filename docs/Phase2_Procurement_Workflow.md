# Sagarmala 2.0 — Phase 2 Procurement Workflow

This document explains the exact relationship and data flow between **Tenders**, **Contractors**, and **Contracts**. Because these three modules interact heavily, they must be executed in a specific sequence.

## Core Truths
1. **Tenders** are the project requirement (The Job).
2. **Contractors** are the companies bidding on the job.
3. **Contracts** are the binding legal agreements created ONLY when a Contractor wins a Tender.

---

## The Procurement Lifecycle (Mermaid Diagram)

```mermaid
flowchart TD
    %% Entities
    Port[Port Authority]
    Sys[Sagarmala System / AI]
    Company[Construction Company]

    %% Phase 1: Preparation
    subgraph 1. Preparation
        Port -- Creates --> T[Draft Tender]
        Company -- Registers Profile --> CR[Contractor: REGISTERED]
    end

    %% Phase 2: Bidding
    subgraph 2. Bidding Window
        T -- Published --> BID_SUB[Tender: BID_SUBMISSION]
        CR -- Verified by Admin --> CV[Contractor: VERIFIED]
        CV -- Submits Price Bid --> VAULT[(Bid Vault)]
    end

    %% Phase 3: Evaluation
    subgraph 3. Evaluation
        VAULT -- Deadline Passes --> CL[Tender: BID_CLOSING]
        CL -- Technical Scores Entered --> TE[Tender: TECHNICAL_EVAL]
        TE -- AI Finds Lowest Cost --> FE[Tender: FINANCIAL_EVAL]
        FE -- System stamps L1 Winner --> L1[Winning Bid Identified]
    end

    %% Phase 4: Award & Contracting
    subgraph 4. Award & Legal Binding
        L1 -- Ministry Sanctions --> A[Tender: AWARDED]
        A -- Unlocks Contract Creation --> CONTR[New Contract Generated]
        CV -- Clears Background Check --> CE[Contractor: EMPANELLED]
        
        CONTR -- Linked To --> CE
    end
    
    %% Final State
    CONTR -- Funds Released --> EXECUTION[Work Orders & Execution Begin]
```

## How the Database Links Them Together

When fixing bugs or querying data across these three pages, this is how they connect in the database:

1. **A Tender is created.** (`id = 1`)
2. **Multiple Contractors register.** (`company_id = 10`, `company_id = 11`)
3. Contractors submit **Bids** linking themselves to the Tender. (`tender_id = 1`, `contractor_id = 10`)
4. The Tender **Awards** the lowest Bid. (`awarded_bid_id = 55`)
5. The **Contract** is generated. It ONLY references the `tender_id = 1`. 
   > *Note:* The Contract does not store the Contractor's ID directly. To find out who the contract belongs to, the system checks: Contract → Tender → Awarded Bid → Contractor.

## Why You Kept Getting Stuck Testing:
The rule is **D14**: *Contracts enforce the D14 rule: cannot be created against un-awarded tenders.*
Because you bypassed the AI Evaluation stage, the Tender reached `AWARDED` without an `awarded_bid_id`. When you opened the **Contracts** page, the system blocked you from creating a contract because it mathematically couldn't find a winning Contractor!

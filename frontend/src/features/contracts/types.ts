// Local TypeScript types for the Contracts feature.
//
// These mirror the backend *Read schemas field-for-field (D10).
// Global types (Contract, WorkOrder) will be added to src/types/index.ts
// by Adithya (Integration Lead) per D13. These local types are used only
// within this feature folder until that happens.

export type ContractStatus = "DRAFT" | "ISSUED" | "ACTIVE" | "CLOSED";
export type WorkOrderStatus = "DRAFT" | "ISSUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ClosureReason =
  | "COMPLETED"
  | "TERMINATED_DEFAULT"
  | "SHORT_CLOSED_MUTUAL"
  | "FORCE_MAJEURE";
export type CancellationReason =
  | "SCOPE_CHANGE"
  | "CONTRACTOR_DEFAULT"
  | "MUTUAL_AGREEMENT"
  | "OTHER";

export interface ContractRead {
  id: number;
  tender_id: number;
  project_id: number;
  contract_number: string;
  title: string;
  description: string | null;
  contract_value: number | null;
  loa_reference: string | null;
  start_date: string | null;
  end_date: string | null;
  issued_date: string | null;
  milestone_terms: string | null;
  status: ContractStatus;
  closure_reason: ClosureReason | null;
  closure_remarks: string | null;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContractCreate {
  tender_id: number;
  project_id: number;
  contract_number: string;
  title: string;
  description?: string | null;
  contract_value?: number | null;
  loa_reference?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  issued_date?: string | null;
  milestone_terms?: string | null;
}

export interface ContractUpdate {
  title?: string;
  description?: string | null;
  status?: ContractStatus;
  contract_value?: number | null;
  loa_reference?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  issued_date?: string | null;
  milestone_terms?: string | null;
  closure_reason?: ClosureReason | null;
  closure_remarks?: string | null;
}

export interface WorkOrderRead {
  id: number;
  contract_id: number;
  work_order_number: string;
  title: string;
  description: string | null;
  scope_of_work: string | null;
  work_order_value: number | null;
  start_date: string | null;
  end_date: string | null;
  status: WorkOrderStatus;
  completion_remarks: string | null;
  cancellation_reason: CancellationReason | null;
  cancellation_remarks: string | null;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderCreate {
  contract_id: number;
  work_order_number: string;
  title: string;
  description?: string | null;
  scope_of_work?: string | null;
  work_order_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface WorkOrderUpdate {
  title?: string;
  description?: string | null;
  status?: WorkOrderStatus;
  scope_of_work?: string | null;
  work_order_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  completion_remarks?: string | null;
  cancellation_reason?: CancellationReason | null;
  cancellation_remarks?: string | null;
}

export interface ContractListFilters {
  project_id?: number;
  tender_id?: number;
  status?: ContractStatus;
}

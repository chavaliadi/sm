export type ClearanceType =
  | "LAND_ACQUISITION"
  | "CRZ"
  | "EC"
  | "FOREST"
  | "CTO"
  | "UTILITY_SHIFTING";

export type ClearanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface Clearance {
  id: number;
  project_id: number;
  clearance_type: ClearanceType;
  title: string;
  authority_name: string;
  status: ClearanceStatus;
  application_date?: string;
  approval_date?: string;
  expiry_date?: string;
  document_url?: string;
  remarks?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ClearanceCreatePayload {
  project_id: number;
  clearance_type: ClearanceType;
  title: string;
  authority_name: string;
  status?: ClearanceStatus;
  application_date?: string;
  approval_date?: string;
  expiry_date?: string;
  document_url?: string;
  remarks?: string;
}

export interface ClearanceExpirySummary {
  total_clearances: number;
  expiring_soon_30_days: number;
  expired_count: number;
  approved_count: number;
  pending_count: number;
}


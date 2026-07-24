export type ContractorStatus = "Registered" | "Verified" | "Empanelled";

export type OrganizationType =
  | "Private Limited"
  | "Partnership"
  | "Sole Proprietorship"
  | "Joint Venture"
  | "PSU";

export interface Contractor {
  id: number;
  name: string;
  registration_number: string;
  organization_type?: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  verification_document_url?: string;
  status: ContractorStatus;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ContractorCreatePayload {
  name: string;
  registration_number: string;
  organization_type?: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  verification_document_url?: string;
}

export interface ContractorSummary {
  total_contractors: number;
  registered_count: number;
  verified_count: number;
  empanelled_count: number;
}

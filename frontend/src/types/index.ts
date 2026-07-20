/**
 * Shared type definitions mirroring backend schemas. This is the payoff of
 * TypeScript for this project: when a backend field name changes, every
 * page using that type gets a compile error pointing at exactly what broke,
 * instead of a silent runtime failure discovered during the demo.
 *
 * Add module types here as each backend module lands. Keep field names in
 * sync with the Pydantic schemas — that's the whole point.
 */

export type UUID = string;

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
  };
}

export interface UserRead {
  id: number;
  name: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
}

export interface ProjectRead {
  id: number;
  project_code: string;
  name: string;
  category: string;
  state: string;
  port_name: string;
  stakeholder_info: string | null;
  funding_model: string;
  estimated_cost: number;
  approved_cost: number | null;
  lifecycle_stage: string;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  project_code: string;
  name: string;
  category: string;
  state: string;
  port_name: string;
  stakeholder_info?: string | null;
  funding_model: string;
  estimated_cost: number;
  approved_cost?: number | null;
  lifecycle_stage?: string;
}

export interface ProjectUpdate {
  project_code?: string;
  name?: string;
  category?: string;
  state?: string;
  port_name?: string;
  stakeholder_info?: string | null;
  funding_model?: string;
  estimated_cost?: number;
  approved_cost?: number | null;
  lifecycle_stage?: string;
  is_active?: boolean;
}

export interface DPRRead {
  id: number;
  project_id: number;
  version: number;
  status: string;
  submitted_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DPRAuditLogRead {
  id: number;
  dpr_id: number;
  actor_id: number;
  action: string;
  comment: string | null;
  timestamp: string;
}

export interface TaskRead {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: number | null;
  due_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StakeholderCreate {
  project_id: number;
  name: string;
  organization: string;
  role: string;
  contact_info?: string | null;
}

export interface StakeholderUpdate {
  project_id?: number;
  name?: string;
  organization?: string;
  role?: string;
  contact_info?: string | null;
}

export interface StakeholderRead {
  id: number;
  project_id: number;
  name: string;
  organization: string;
  role: string;
  contact_info: string | null;
  is_active: boolean;
}

export interface MeetingCreate {
  project_id: number;
  title: string;
  date: string;
  notes?: string | null;
}

export interface MeetingUpdate {
  project_id?: number;
  title?: string;
  date?: string;
  notes?: string | null;
}

export interface MeetingRead {
  id: number;
  project_id: number;
  title: string;
  date: string;
  notes: string | null;
  is_active: boolean;
}

export interface NotificationRead {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}


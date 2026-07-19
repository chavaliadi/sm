export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskBase {
  project_id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: number | null;
  due_date: string | null;
  evidence_url: string | null;
  is_active: boolean;
}

export interface TaskCreate extends TaskBase {}

export interface TaskUpdate {
  project_id?: number;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: number | null;
  due_date?: string | null;
  evidence_url?: string | null;
  is_active?: boolean;
}

export interface TaskRead extends TaskBase {
  id: number;
  created_at: string;
}

export interface TaskListFilters {
  project_id?: number;
  assigned_to?: number;
  status?: TaskStatus;
}

import { apiClient } from "./client";
import type {
  PaginatedResponse,
  ProjectRead,
  DPRRead,
  TaskRead,
  StakeholderRead,
  MeetingRead,
} from "@/types";

export async function getProjects(): Promise<PaginatedResponse<ProjectRead>> {
  const response = await apiClient.get<PaginatedResponse<ProjectRead>>("/projects");
  return response.data;
}

export async function getDprs(): Promise<PaginatedResponse<DPRRead>> {
  const response = await apiClient.get<PaginatedResponse<DPRRead>>("/dpr");
  return response.data;
}

export async function deleteDpr(id: number): Promise<{ data: { message: string } }> {
  const response = await apiClient.delete<{ data: { message: string } }>(`/dpr/${id}`);
  return response.data;
}

export async function getTasks(): Promise<PaginatedResponse<TaskRead>> {
  const response = await apiClient.get<PaginatedResponse<TaskRead>>("/tasks");
  return response.data;
}

export async function getStakeholders(): Promise<PaginatedResponse<StakeholderRead>> {
  const response = await apiClient.get<PaginatedResponse<StakeholderRead>>("/stakeholders");
  return response.data;
}

export async function getMeetings(): Promise<PaginatedResponse<MeetingRead>> {
  const response = await apiClient.get<PaginatedResponse<MeetingRead>>("/stakeholders/meetings");
  return response.data;
}

export async function getDprAuditTrail(id: number): Promise<PaginatedResponse<any>> {
  const response = await apiClient.get<PaginatedResponse<any>>(`/dpr/${id}/audit-trail`);
  return response.data;
}

export async function submitDpr(id: number): Promise<{ data: DPRRead }> {
  const response = await apiClient.put<{ data: DPRRead }>(`/dpr/${id}/submit`);
  return response.data;
}

export async function smfclReviewDpr(id: number, decision: "approve" | "reject", comment?: string): Promise<{ data: DPRRead }> {
  const response = await apiClient.put<{ data: DPRRead }>(`/dpr/${id}/smfcl-review`, { decision, comment });
  return response.data;
}

export async function ministryReviewDpr(id: number, decision: "approve" | "reject", comment?: string): Promise<{ data: DPRRead }> {
  const response = await apiClient.put<{ data: DPRRead }>(`/dpr/${id}/ministry-review`, { decision, comment });
  return response.data;
}

export async function smfclRequeueDpr(id: number): Promise<{ data: DPRRead }> {
  const response = await apiClient.put<{ data: DPRRead }>(`/dpr/${id}/smfcl-requeue`);
  return response.data;
}

export async function releaseDprFunds(id: number): Promise<{ data: DPRRead }> {
  const response = await apiClient.put<{ data: DPRRead }>(`/dpr/${id}/release-funds`);
  return response.data;
}

export async function createDpr(payload: { project_id: number }): Promise<{ data: DPRRead }> {
  const response = await apiClient.post<{ data: DPRRead }>(`/dpr`, payload);
  return response.data;
}

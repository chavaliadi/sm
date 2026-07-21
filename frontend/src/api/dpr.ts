import { apiClient } from "@/api/client";
import type { PaginatedResponse, DPRRead, DPRAuditLogRead } from "@/types";

interface SuccessResponse<T> {
  data: T;
  meta: Record<string, never>;
}

export async function getDprs(projectId?: number): Promise<PaginatedResponse<DPRRead>> {
  const response = await apiClient.get<PaginatedResponse<DPRRead>>("/dpr", {
    params: projectId ? { project_id: projectId } : undefined,
  });
  return response.data;
}

export async function createDpr(projectId: number): Promise<DPRRead> {
  const response = await apiClient.post<SuccessResponse<DPRRead>>("/dpr", {
    project_id: projectId,
  });
  return response.data.data;
}

export async function submitDpr(dprId: number): Promise<DPRRead> {
  const response = await apiClient.put<SuccessResponse<DPRRead>>(`/dpr/${dprId}/submit`);
  return response.data.data;
}

export async function smfclReviewDpr(
  dprId: number,
  decision: "approve" | "reject",
  comment?: string
): Promise<DPRRead> {
  const response = await apiClient.put<SuccessResponse<DPRRead>>(`/dpr/${dprId}/smfcl-review`, {
    decision,
    comment,
  });
  return response.data.data;
}

export async function ministryReviewDpr(
  dprId: number,
  decision: "approve" | "reject",
  comment?: string
): Promise<DPRRead> {
  const response = await apiClient.put<SuccessResponse<DPRRead>>(`/dpr/${dprId}/ministry-review`, {
    decision,
    comment,
  });
  return response.data.data;
}

export async function smfclRequeueDpr(dprId: number): Promise<DPRRead> {
  const response = await apiClient.put<SuccessResponse<DPRRead>>(`/dpr/${dprId}/smfcl-requeue`);
  return response.data.data;
}

export async function releaseDprFunds(dprId: number): Promise<DPRRead> {
  const response = await apiClient.put<SuccessResponse<DPRRead>>(`/dpr/${dprId}/release-funds`);
  return response.data.data;
}

export async function getDprAuditTrail(dprId: number): Promise<PaginatedResponse<DPRAuditLogRead>> {
  const response = await apiClient.get<PaginatedResponse<DPRAuditLogRead>>(`/dpr/${dprId}/audit-trail`);
  return response.data;
}

export async function deleteDpr(dprId: number): Promise<void> {
  await apiClient.delete(`/dpr/${dprId}`);
}

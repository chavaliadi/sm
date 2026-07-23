import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";
import type { Clearance, ClearanceCreatePayload, ClearanceExpirySummary } from "./types";

export async function getClearances(params?: {
  page?: number;
  page_size?: number;
  project_id?: number;
  clearance_type?: string;
  status?: string;
  expiring_soon?: boolean;
}): Promise<PaginatedResponse<Clearance>> {
  const response = await apiClient.get<PaginatedResponse<Clearance>>("/api/clearances", { params });
  return response.data;
}

export async function getClearanceSummary(project_id?: number): Promise<{ data: ClearanceExpirySummary }> {
  const response = await apiClient.get<{ data: ClearanceExpirySummary }>("/api/clearances/summary", {
    params: { project_id },
  });
  return response.data;
}

export async function createClearance(payload: ClearanceCreatePayload): Promise<{ data: Clearance }> {
  const response = await apiClient.post<{ data: Clearance }>("/api/clearances", payload);
  return response.data;
}

export async function updateClearance(
  id: number,
  payload: Partial<ClearanceCreatePayload>
): Promise<{ data: Clearance }> {
  const response = await apiClient.put<{ data: Clearance }>(`/api/clearances/${id}`, payload);
  return response.data;
}

export async function deleteClearance(id: number): Promise<{ data: Clearance }> {
  const response = await apiClient.delete<{ data: Clearance }>(`/api/clearances/${id}`);
  return response.data;
}

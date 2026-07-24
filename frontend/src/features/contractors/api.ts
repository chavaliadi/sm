import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";
import type { Contractor, ContractorCreatePayload, ContractorStatus, ContractorSummary } from "./types";

export async function getContractors(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  organization_type?: string;
  search?: string;
}): Promise<PaginatedResponse<Contractor>> {
  const response = await apiClient.get<PaginatedResponse<Contractor>>("/api/contractors", { params });
  return response.data;
}

export async function getContractorSummary(): Promise<{ data: ContractorSummary }> {
  const response = await apiClient.get<{ data: ContractorSummary }>("/api/contractors/summary");
  return response.data;
}

export async function getContractorById(id: number): Promise<{ data: Contractor }> {
  const response = await apiClient.get<{ data: Contractor }>(`/api/contractors/${id}`);
  return response.data;
}

export async function createContractor(payload: ContractorCreatePayload): Promise<{ data: Contractor }> {
  const response = await apiClient.post<{ data: Contractor }>("/api/contractors", payload);
  return response.data;
}

export async function updateContractor(
  id: number,
  payload: Partial<ContractorCreatePayload>
): Promise<{ data: Contractor }> {
  const response = await apiClient.put<{ data: Contractor }>(`/api/contractors/${id}`, payload);
  return response.data;
}

export async function updateContractorStatus(
  id: number,
  status: ContractorStatus
): Promise<{ data: Contractor }> {
  const response = await apiClient.patch<{ data: Contractor }>(`/api/contractors/${id}/status`, { status });
  return response.data;
}

export async function deleteContractor(id: number): Promise<{ data: Contractor }> {
  const response = await apiClient.delete<{ data: Contractor }>(`/api/contractors/${id}`);
  return response.data;
}

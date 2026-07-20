import { apiClient } from "./client";
import type {
  StakeholderRead,
  StakeholderCreate,
  StakeholderUpdate,
  PaginatedResponse,
} from "../types";

export async function fetchStakeholders(
  projectId?: number,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<StakeholderRead>> {
  const params: Record<string, unknown> = { page, page_size: pageSize };
  if (projectId !== undefined) {
    params.project_id = projectId;
  }
  const response = await apiClient.get<PaginatedResponse<StakeholderRead>>(
    "/stakeholders",
    { params }
  );
  return response.data;
}

export async function fetchStakeholderById(
  id: number
): Promise<StakeholderRead> {
  const response = await apiClient.get<{ data: StakeholderRead }>(
    `/stakeholders/${id}`
  );
  return response.data.data;
}

export async function createStakeholder(
  data: StakeholderCreate
): Promise<StakeholderRead> {
  const response = await apiClient.post<{ data: StakeholderRead }>(
    "/stakeholders",
    data
  );
  return response.data.data;
}

export async function updateStakeholder(
  id: number,
  data: StakeholderUpdate
): Promise<StakeholderRead> {
  const response = await apiClient.put<{ data: StakeholderRead }>(
    `/stakeholders/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteStakeholder(id: number): Promise<void> {
  await apiClient.delete(`/stakeholders/${id}`);
}

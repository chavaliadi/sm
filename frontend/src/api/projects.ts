import { apiClient } from "@/api/client";
import type { PaginatedResponse, ProjectRead, ProjectCreate, ProjectUpdate } from "@/types";

export interface ProjectListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  state?: string;
  lifecycle_stage?: string;
}

interface SuccessResponse<T> {
  data: T;
  meta: Record<string, never>;
}

export async function getProjects(
  params?: ProjectListParams
): Promise<PaginatedResponse<ProjectRead>> {
  const response = await apiClient.get<PaginatedResponse<ProjectRead>>("/projects", {
    params,
  });
  return response.data;
}

export async function createProject(body: ProjectCreate): Promise<ProjectRead> {
  const response = await apiClient.post<SuccessResponse<ProjectRead>>("/projects", body);
  return response.data.data;
}

export async function updateProject(id: number, body: ProjectUpdate): Promise<ProjectRead> {
  const response = await apiClient.put<SuccessResponse<ProjectRead>>(`/projects/${id}`, body);
  return response.data.data;
}

export async function deleteProject(id: number): Promise<ProjectRead> {
  const response = await apiClient.delete<SuccessResponse<ProjectRead>>(`/projects/${id}`);
  return response.data.data;
}

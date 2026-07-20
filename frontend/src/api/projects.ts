import { apiClient } from "@/api/client";
import type { PaginatedResponse, ProjectRead } from "@/types";

export interface ProjectListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  state?: string;
  lifecycle_stage?: string;
}

export async function getProjects(
  params?: ProjectListParams
): Promise<PaginatedResponse<ProjectRead>> {
  const response = await apiClient.get<PaginatedResponse<ProjectRead>>("/projects", {
    params,
  });
  return response.data;
}

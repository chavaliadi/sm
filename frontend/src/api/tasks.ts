import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";
import type { TaskRead, TaskListFilters } from "@/types/task";

export async function getTasks(
  page = 1,
  pageSize = 100,
  filters?: TaskListFilters
): Promise<PaginatedResponse<TaskRead>> {
  const response = await apiClient.get<PaginatedResponse<TaskRead>>("/tasks", {
    params: { page, page_size: pageSize, ...filters },
  });
  return response.data;
}

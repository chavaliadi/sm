import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";
import type {
  TaskCreate,
  TaskListFilters,
  TaskRead,
  TaskStatus,
  TaskUpdate,
} from "@/types/task";

interface SuccessResponse<T> {
  data: T;
  meta: Record<string, never>;
}

export async function getTasks(
  page: number,
  pageSize: number,
  filters: TaskListFilters,
): Promise<PaginatedResponse<TaskRead>> {
  const response = await apiClient.get<PaginatedResponse<TaskRead>>("/tasks", {
    params: { page, page_size: pageSize, ...filters },
  });
  return response.data;
}

export async function createTask(body: TaskCreate): Promise<TaskRead> {
  const response = await apiClient.post<SuccessResponse<TaskRead>>("/tasks", body);
  return response.data.data;
}

export async function updateTask(
  taskId: number,
  body: TaskUpdate,
): Promise<TaskRead> {
  const response = await apiClient.put<SuccessResponse<TaskRead>>(
    `/tasks/${taskId}`,
    body,
  );
  return response.data.data;
}

export async function updateTaskStatus(
  taskId: number,
  status: TaskStatus,
): Promise<TaskRead> {
  const response = await apiClient.patch<SuccessResponse<TaskRead>>(
    `/tasks/${taskId}/status`,
    { status },
  );
  return response.data.data;
}

export async function deleteTask(taskId: number): Promise<TaskRead> {
  const response = await apiClient.delete<SuccessResponse<TaskRead>>(
    `/tasks/${taskId}`,
  );
  return response.data.data;
}

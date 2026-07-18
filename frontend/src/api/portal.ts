import { apiClient } from "./client";
import type {
  PaginatedResponse,
  ProjectRead,
  DPRRead,
  TaskRead,
  StakeholderRead,
  MeetingRead,
  NotificationRead,
  DPRAuditLogRead,
  SuccessResponse,
} from "@/types";

export async function getProjects(): Promise<PaginatedResponse<ProjectRead>> {
  const response = await apiClient.get<PaginatedResponse<ProjectRead>>("/projects");
  return response.data;
}

export async function getDprs(): Promise<PaginatedResponse<DPRRead>> {
  const response = await apiClient.get<PaginatedResponse<DPRRead>>("/dpr");
  return response.data;
}

export async function deleteDpr(id: number): Promise<SuccessResponse<{ message: string }>> {
  const response = await apiClient.delete<SuccessResponse<{ message: string }>>(`/dpr/${id}`);
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

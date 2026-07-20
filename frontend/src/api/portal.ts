import { apiClient } from "./client";
import type {
  PaginatedResponse,
  ProjectRead,
  ProjectCreate,
  ProjectUpdate,
  DPRRead,
  TaskRead,
  StakeholderRead,
  MeetingRead,
  SuccessResponse,
} from "@/types";

export interface GetProjectsParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  state?: string;
  lifecycle_stage?: string;
}

export async function getProjects(params?: GetProjectsParams): Promise<PaginatedResponse<ProjectRead>> {
  const response = await apiClient.get<PaginatedResponse<ProjectRead>>("/projects", { params });
  return response.data;
}

export async function getProjectById(id: number): Promise<SuccessResponse<ProjectRead>> {
  const response = await apiClient.get<SuccessResponse<ProjectRead>>(`/projects/${id}`);
  return response.data;
}

export async function createProject(data: ProjectCreate): Promise<SuccessResponse<ProjectRead>> {
  const response = await apiClient.post<SuccessResponse<ProjectRead>>("/projects", data);
  return response.data;
}

export async function updateProject(id: number, data: ProjectUpdate): Promise<SuccessResponse<ProjectRead>> {
  const response = await apiClient.put<SuccessResponse<ProjectRead>>(`/projects/${id}`, data);
  return response.data;
}

export async function deleteProject(id: number): Promise<SuccessResponse<ProjectRead>> {
  const response = await apiClient.delete<SuccessResponse<ProjectRead>>(`/projects/${id}`);
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

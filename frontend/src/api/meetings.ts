import { apiClient } from "./client";
import type {
  MeetingRead,
  MeetingCreate,
  MeetingUpdate,
  PaginatedResponse,
} from "../types";

export async function fetchMeetings(
  projectId?: number,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<MeetingRead>> {
  const params: Record<string, unknown> = { page, page_size: pageSize };
  if (projectId !== undefined) {
    params.project_id = projectId;
  }
  const response = await apiClient.get<PaginatedResponse<MeetingRead>>(
    "/meetings",
    { params }
  );
  return response.data;
}

export async function fetchMeetingById(id: number): Promise<MeetingRead> {
  const response = await apiClient.get<{ data: MeetingRead }>(
    `/meetings/${id}`
  );
  return response.data.data;
}

export async function createMeeting(
  data: MeetingCreate
): Promise<MeetingRead> {
  const response = await apiClient.post<{ data: MeetingRead }>(
    "/meetings",
    data
  );
  return response.data.data;
}

export async function updateMeeting(
  id: number,
  data: MeetingUpdate
): Promise<MeetingRead> {
  const response = await apiClient.put<{ data: MeetingRead }>(
    `/meetings/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteMeeting(id: number): Promise<void> {
  await apiClient.delete(`/meetings/${id}`);
}

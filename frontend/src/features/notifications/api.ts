import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";
import type { NotificationRead } from "./types";

export async function getNotifications(): Promise<PaginatedResponse<NotificationRead>> {
  const response = await apiClient.get<PaginatedResponse<NotificationRead>>("/notifications");
  return response.data;
}

export async function deleteNotification(id: number): Promise<{ data: { message: string } }> {
  const response = await apiClient.delete<{ data: { message: string } }>(`/notifications/${id}`);
  return response.data;
}
export async function markAllAsRead(): Promise<{ data: { message: string } }> {
  const response = await apiClient.put<{ data: { message: string } }>("/notifications/read-all");
  return response.data;
}

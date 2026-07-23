import { apiClient } from "./client";
import type { PaginatedResponse, UserRead } from "@/types";

export interface LoginResponse {
  data: {
    access_token: string;
    token_type: string;
    user: UserRead;
  };
}

export interface UserListParams {
  page?: number;
  page_size?: number;
}

export async function getUsers(
  params?: UserListParams,
): Promise<PaginatedResponse<UserRead>> {
  const response = await apiClient.get<PaginatedResponse<UserRead>>(
    "/auth/users",
    { params },
  );
  return {
    ...response.data,
    data: response.data.data.filter((user) => user.is_active),
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResponse["data"]> {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    const { access_token } = response.data.data;
    if (access_token) {
      window.localStorage.setItem("access_token", access_token);
    }
    return response.data.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Invalid credentials. Please try again.",
    );
  }
}

export function logoutUser(): void {
  window.localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  return Boolean(window.localStorage.getItem("access_token"));
}

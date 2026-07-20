import { apiClient } from "./client";
import type { UserRead } from "@/types";

export interface LoginResponse {
  data: {
    access_token: string;
    token_type: string;
    user: UserRead;
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
  } catch (error: any) {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.detail?.message ||
      error.response?.data?.detail ||
      (error instanceof Error ? error.message : "Invalid credentials. Please try again.");
    throw new Error(message);
  }
}

export function logoutUser(): void {
  window.localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  return Boolean(window.localStorage.getItem("access_token"));
}

import { apiClient } from "./client";
import type { SuccessResponse, UserRead } from "@/types";

export interface TokenPayload {
  access_token: string;
  token_type: string;
  user: UserRead;
}

export async function loginUser(email: string, password: string): Promise<SuccessResponse<TokenPayload>> {
  const response = await apiClient.post<SuccessResponse<TokenPayload>>("/auth/login", {
    email,
    password,
  });
  return response.data;
}

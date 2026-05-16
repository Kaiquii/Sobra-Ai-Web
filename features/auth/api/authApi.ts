import { apiClient } from "@/lib/api";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "@/features/auth/types/auth";

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<RegisterResponse>("/api/auth/register", data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/api/auth/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/api/auth/reset-password", data);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await apiClient.patch<UpdateProfileResponse>(
      "/api/users/profile",
      data,
    );

    return response.data;
  },
};

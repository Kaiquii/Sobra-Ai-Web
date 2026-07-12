import { apiClient } from "@/lib/api";
import type {
  ForgotPasswordRequest,
  GetProfileResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  RequestRegisterCodeRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UploadProfilePhotoResponse,
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

  requestRegisterCode: async (data: RequestRegisterCodeRequest) => {
    const response = await apiClient.post<MessageResponse>(
      "/api/auth/request-register-code",
      data,
    );

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

  getProfile: async () => {
    const response = await apiClient.get<GetProfileResponse>("/api/users/profile");
    return response.data;
  },

  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await apiClient.patch<UploadProfilePhotoResponse>(
      "/api/users/profile/photo",
      formData,
    );

    return response.data;
  },

  deleteProfilePhoto: async () => {
    const response = await apiClient.delete<MessageResponse>(
      "/api/users/profile/photo",
    );

    return response.data;
  },
};

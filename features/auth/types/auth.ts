export type AuthUser = {
  access_blocked?: boolean;
  access_blocked_at?: string | null;
  avatar_cache_key?: number | null;
  avatar_url?: string | null;
  email: string;
  name: string;
  role: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type UpdateProfileRequest = {
  name: string;
  email: string;
};

export type UpdateProfileResponse = {
  message?: string;
  user?: AuthUser;
};

export type GetProfileResponse = {
  user: AuthUser;
};

export type UploadProfilePhotoResponse = {
  avatar_url: string | null;
  message: string;
};

export type RegisterRequest = {
  code: string;
  name: string;
  email: string;
  password: string;
};

export type RequestRegisterCodeRequest = {
  email: string;
};

export type RegisterResponse = {
  message: string;
  user_id: number;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type MessageResponse = {
  message: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  new_password: string;
};

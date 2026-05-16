export type AuthUser = {
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

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
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

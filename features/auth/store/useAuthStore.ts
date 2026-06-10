"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authApi } from "@/features/auth/api/authApi";
import type {
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
} from "@/features/auth/types/auth";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  clearBrowserAuthToken,
  getBrowserAuthToken,
  setBrowserAuthToken,
} from "@/lib/auth-cookie";

type AuthState = {
  error: string | null;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  message: string | null;
  user: AuthUser | null;
  clearFeedback: () => void;
  deleteProfilePhoto: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  loadProfile: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: (errorMessage?: string | null) => void;
  register: (data: RegisterRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  restoreSession: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      error: null,
      hasHydrated: false,
      isAuthenticated: false,
      isLoading: false,
      message: null,
      user: null,

      clearFeedback: () => set({ error: null, message: null }),

      deleteProfilePhoto: async () => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.deleteProfilePhoto();

          set((state) => ({
            isLoading: false,
            message: response.message,
            user: state.user
              ? { ...state.user, avatar_cache_key: null, avatar_url: null }
              : null,
          }));
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      forgotPassword: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.forgotPassword(data);
          set({ isLoading: false, message: response.message });
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      loadProfile: async () => {
        set({ error: null });

        try {
          const response = await authApi.getProfile();

          set((state) => ({
            user: {
              avatar_cache_key:
                response.user.avatar_url === state.user?.avatar_url
                  ? (state.user?.avatar_cache_key ?? null)
                  : Date.now(),
              avatar_url: response.user.avatar_url ?? null,
              email: response.user.email ?? state.user?.email ?? "",
              name: response.user.name ?? state.user?.name ?? "",
              role: response.user.role ?? state.user?.role ?? "user",
            },
          }));
        } catch (error) {
          set({ error: getApiErrorMessage(error) });
          throw error;
        }
      },

      login: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.login(data);

          setBrowserAuthToken(response.token);
          set({
            error: null,
            isAuthenticated: true,
            isLoading: false,
            message: response.message,
            user: {
              ...response.user,
              avatar_cache_key: response.user.avatar_url ? Date.now() : null,
            },
          });
        } catch (error) {
          set({
            error: getApiErrorMessage(error),
            isAuthenticated: false,
            isLoading: false,
            message: null,
            user: null,
          });
          throw error;
        }
      },

      logout: (errorMessage = null) => {
        clearBrowserAuthToken();
        set({
          error: errorMessage,
          isAuthenticated: false,
          isLoading: false,
          message: null,
          user: null,
        });
      },

      register: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.register(data);
          set({ isLoading: false, message: response.message });
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      resetPassword: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.resetPassword(data);
          set({ isLoading: false, message: response.message });
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      restoreSession: () =>
        set((state) => {
          const token = getBrowserAuthToken();

          return {
            error: null,
            isAuthenticated: Boolean(token),
            isLoading: false,
            message: null,
            user: token ? state.user : null,
          };
        }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateProfile: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.updateProfile(data);

          set((state) => ({
            isLoading: false,
            message: response.message ?? "Perfil atualizado com sucesso!",
            user: {
              avatar_cache_key: state.user?.avatar_cache_key ?? null,
              avatar_url: response.user?.avatar_url ?? state.user?.avatar_url ?? null,
              email: response.user?.email ?? data.email,
              name: response.user?.name ?? data.name,
              role: response.user?.role ?? state.user?.role ?? "user",
            },
          }));
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      uploadProfilePhoto: async (file) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.uploadProfilePhoto(file);

          set((state) => ({
            isLoading: false,
            message: response.message,
            user: state.user
              ? {
                  ...state.user,
                  avatar_cache_key: response.avatar_url ? Date.now() : null,
                  avatar_url: response.avatar_url ?? null,
                }
              : null,
          }));
        } catch (error) {
          set({ error: getApiErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },
    }),
    {
      name: "app-financeiro-auth",
      onRehydrateStorage: () => (state) => {
        state?.restoreSession();
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

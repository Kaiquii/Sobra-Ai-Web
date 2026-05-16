"use client";

import axios from "axios";
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
import { setApiAuthorizationToken } from "@/lib/api";

type AuthState = {
  error: string | null;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  message: string | null;
  token: string | null;
  user: AuthUser | null;
  clearFeedback: () => void;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  setHasHydrated: (hasHydrated: boolean) => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }

      if ("error" in data && typeof data.error === "string") {
        return data.error;
      }
    }
  }

  return "Nao foi possivel concluir a acao. Tente novamente.";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      error: null,
      hasHydrated: false,
      isAuthenticated: false,
      isLoading: false,
      message: null,
      token: null,
      user: null,

      clearFeedback: () => set({ error: null, message: null }),

      forgotPassword: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.forgotPassword(data);
          set({ isLoading: false, message: response.message });
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      login: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.login(data);

          setApiAuthorizationToken(response.token);
          set({
            error: null,
            isAuthenticated: true,
            isLoading: false,
            message: response.message,
            token: response.token,
            user: response.user,
          });
        } catch (error) {
          set({
            error: getErrorMessage(error),
            isAuthenticated: false,
            isLoading: false,
            message: null,
            token: null,
            user: null,
          });
          throw error;
        }
      },

      logout: () => {
        setApiAuthorizationToken(null);
        set({
          error: null,
          isAuthenticated: false,
          isLoading: false,
          message: null,
          token: null,
          user: null,
        });
      },

      register: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.register(data);
          set({ isLoading: false, message: response.message });
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      resetPassword: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.resetPassword(data);
          set({ isLoading: false, message: response.message });
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateProfile: async (data) => {
        set({ error: null, isLoading: true, message: null });

        try {
          const response = await authApi.updateProfile(data);

          set((state) => ({
            isLoading: false,
            message: response.message ?? "Perfil atualizado com sucesso!",
            user: {
              email: response.user?.email ?? data.email,
              name: response.user?.name ?? data.name,
              role: response.user?.role ?? state.user?.role ?? "user",
            },
          }));
        } catch (error) {
          set({ error: getErrorMessage(error), isLoading: false, message: null });
          throw error;
        }
      },
    }),
    {
      name: "app-financeiro-auth",
      onRehydrateStorage: () => (state) => {
        const token = state?.token ?? null;

        setApiAuthorizationToken(token);

        if (!token) {
          state?.logout();
        }

        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    },
  ),
);

import { create } from "zustand";
import type { AuthUser } from "../features/auth/types";

type AuthStore = {
  user: AuthUser | null;

  setUser: (user: AuthUser) => void;

  logout: () => void;
};

export const useAuthStore =
  create<AuthStore>((set) => ({
    user: null,

    setUser: (user) =>
      set({ user }),

    logout: () =>
      set({ user: null }),
  }));

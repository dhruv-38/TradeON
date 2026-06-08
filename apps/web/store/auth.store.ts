import { create } from "zustand";

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthStore = {
  user: User | null;

  setUser: (user: User) => void;

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
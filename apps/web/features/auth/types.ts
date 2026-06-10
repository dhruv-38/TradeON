import type { AuthUser } from "../../store/auth.store";

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};

export type SignupResponse = {
  message: string;
  user: AuthUser;
};

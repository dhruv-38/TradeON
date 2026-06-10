import { api } from "../../lib/api";
import type {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
} from "./types";

export async function login(payload: LoginPayload) {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function signup(payload: SignupPayload) {
  const response = await api.post<SignupResponse>("/auth/signup", payload);
  return response.data;
}

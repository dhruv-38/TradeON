import { api } from "../../../lib/api";
import type { SignupPayload, SignupResponse } from "../types";

export async function signup(payload: SignupPayload) {
  const response = await api.post<SignupResponse>("/auth/signup", payload);
  return response.data;
}
